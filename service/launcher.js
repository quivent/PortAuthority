/**
 * Launcher - Start, stop, and manage services under Port Authority control
 */

const { spawn } = require('child_process');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const execAsync = util.promisify(exec);

class Launcher {
    constructor(registry) {
        this.registry = registry;
        this.processes = new Map(); // serviceName -> process object
        this.logDir = process.env.PORT_AUTHORITY_LOG_DIR || '/tmp/port-authority-logs';

        // Ensure log directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Launch a service with its allocated port
     * Options:
     *   - command: Command to run (required)
     *   - cwd: Working directory
     *   - env: Environment variables (will merge with PORT)
     *   - autoRestart: Auto-restart on crash (default: false)
     *   - captureOutput: Capture stdout/stderr to log files (default: true)
     */
    async launch(serviceName, options = {}) {
        const allocation = this.registry.getByService(serviceName);

        if (!allocation) {
            throw new Error(`Service '${serviceName}' not found. Allocate a port first with 'portauth allocate ${serviceName}'`);
        }

        // Check if already running
        if (allocation.process_status === 'running' && allocation.process_pid) {
            const isAlive = await this.isProcessAlive(allocation.process_pid);
            if (isAlive) {
                throw new Error(`Service '${serviceName}' is already running (PID: ${allocation.process_pid})`);
            }
        }

        const { command, cwd, env, autoRestart, captureOutput } = options;

        if (!command) {
            throw new Error('Command is required to launch service');
        }

        // Prepare environment with PORT variable
        const processEnv = {
            ...process.env,
            ...env,
            PORT: allocation.port.toString()
        };

        // Prepare command (handle shell commands)
        const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
        const shellArgs = process.platform === 'win32' ? ['/c', command] : ['-c', command];

        // Launch process
        const proc = spawn(shell, shellArgs, {
            cwd: cwd || process.cwd(),
            env: processEnv,
            detached: true, // Run in background
            stdio: captureOutput !== false ? ['ignore', 'pipe', 'pipe'] : 'ignore'
        });

        // Setup log files if capturing output
        if (captureOutput !== false) {
            const stdoutLog = path.join(this.logDir, `${serviceName}.stdout.log`);
            const stderrLog = path.join(this.logDir, `${serviceName}.stderr.log`);

            const stdoutStream = fs.createWriteStream(stdoutLog, { flags: 'a' });
            const stderrStream = fs.createWriteStream(stderrLog, { flags: 'a' });

            proc.stdout.pipe(stdoutStream);
            proc.stderr.pipe(stderrStream);
        }

        // Store process reference
        this.processes.set(serviceName, proc);

        // Update registry
        this.registry.updateProcess(serviceName, {
            pid: proc.pid,
            status: 'running',
            command,
            cwd: cwd || process.cwd(),
            env: processEnv,
            startedAt: new Date().toISOString(),
            autoRestart: autoRestart || false
        });

        // Handle process exit
        proc.on('exit', (code, signal) => {
            console.log(`Service '${serviceName}' exited with code ${code} (signal: ${signal})`);

            this.processes.delete(serviceName);

            const status = code === 0 ? 'stopped' : 'crashed';
            this.registry.updateProcessStatus(serviceName, status);

            // Auto-restart if enabled and crashed
            if (autoRestart && code !== 0) {
                console.log(`Auto-restarting '${serviceName}'...`);
                setTimeout(() => {
                    this.launch(serviceName, options).catch(err => {
                        console.error(`Failed to auto-restart '${serviceName}':`, err.message);
                    });
                }, 1000);
            }
        });

        proc.on('error', (error) => {
            console.error(`Error launching '${serviceName}':`, error);
            this.registry.updateProcessStatus(serviceName, 'crashed');
        });

        // Unref so process runs independently
        proc.unref();

        return {
            serviceName,
            port: allocation.port,
            pid: proc.pid,
            command,
            status: 'running'
        };
    }

    /**
     * Stop a running service
     */
    async stop(serviceName, options = {}) {
        const allocation = this.registry.getByService(serviceName);

        if (!allocation) {
            throw new Error(`Service '${serviceName}' not found`);
        }

        if (allocation.process_status !== 'running' || !allocation.process_pid) {
            throw new Error(`Service '${serviceName}' is not running`);
        }

        const pid = allocation.process_pid;
        const force = options.force || false;

        try {
            // Try graceful shutdown first (SIGTERM)
            await execAsync(`kill -${force ? '9' : '15'} ${pid}`);

            // Wait a bit for graceful shutdown
            if (!force) {
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Check if still alive
                const isAlive = await this.isProcessAlive(pid);
                if (isAlive) {
                    // Force kill if still alive
                    await execAsync(`kill -9 ${pid}`);
                }
            }

            this.processes.delete(serviceName);
            this.registry.updateProcessStatus(serviceName, 'stopped');

            return {
                serviceName,
                pid,
                status: 'stopped'
            };
        } catch (error) {
            // Process might already be dead
            if (error.message.includes('No such process')) {
                this.registry.updateProcessStatus(serviceName, 'stopped');
                return {
                    serviceName,
                    pid,
                    status: 'stopped'
                };
            }
            throw new Error(`Failed to stop service: ${error.message}`);
        }
    }

    /**
     * Restart a service
     */
    async restart(serviceName, options = {}) {
        const allocation = this.registry.getByService(serviceName);

        if (!allocation) {
            throw new Error(`Service '${serviceName}' not found`);
        }

        // Stop if running
        if (allocation.process_status === 'running' && allocation.process_pid) {
            await this.stop(serviceName, { force: false });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Relaunch with stored command
        if (!allocation.process_command) {
            throw new Error(`No launch command stored for '${serviceName}'. Use 'portauth launch' with --command option first.`);
        }

        const launchOptions = {
            command: allocation.process_command,
            cwd: allocation.process_cwd,
            env: allocation.process_env ? JSON.parse(allocation.process_env) : {},
            autoRestart: allocation.auto_restart === 1,
            ...options
        };

        return await this.launch(serviceName, launchOptions);
    }

    /**
     * Get status of a service
     */
    async status(serviceName) {
        const allocation = this.registry.getByService(serviceName);

        if (!allocation) {
            throw new Error(`Service '${serviceName}' not found`);
        }

        let actualStatus = allocation.process_status;

        // Verify process is actually running
        if (allocation.process_status === 'running' && allocation.process_pid) {
            const isAlive = await this.isProcessAlive(allocation.process_pid);
            if (!isAlive) {
                actualStatus = 'stopped';
                this.registry.updateProcessStatus(serviceName, 'stopped');
            }
        }

        return {
            serviceName: allocation.serviceName,
            port: allocation.port,
            project: allocation.project,
            status: actualStatus,
            pid: allocation.process_pid,
            command: allocation.process_command,
            startedAt: allocation.process_started_at,
            stoppedAt: allocation.process_stopped_at,
            autoRestart: allocation.auto_restart === 1,
            logs: {
                stdout: path.join(this.logDir, `${serviceName}.stdout.log`),
                stderr: path.join(this.logDir, `${serviceName}.stderr.log`)
            }
        };
    }

    /**
     * Get status of all services
     */
    async statusAll(options = {}) {
        const allocations = this.registry.getAllAllocations();
        const statuses = [];

        for (const allocation of allocations) {
            if (options.runningOnly && allocation.process_status !== 'running') {
                continue;
            }

            const status = await this.status(allocation.serviceName);
            statuses.push(status);
        }

        return statuses;
    }

    /**
     * Check if a process is alive
     */
    async isProcessAlive(pid) {
        try {
            await execAsync(`kill -0 ${pid} 2>/dev/null`);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get logs for a service
     */
    getLogs(serviceName, options = {}) {
        const lines = options.lines || 50;
        const stdoutLog = path.join(this.logDir, `${serviceName}.stdout.log`);
        const stderrLog = path.join(this.logDir, `${serviceName}.stderr.log`);

        const logs = {};

        if (fs.existsSync(stdoutLog)) {
            try {
                const content = fs.readFileSync(stdoutLog, 'utf8');
                const allLines = content.split('\n').filter(l => l);
                logs.stdout = allLines.slice(-lines);
            } catch (error) {
                logs.stdout = [];
            }
        } else {
            logs.stdout = [];
        }

        if (fs.existsSync(stderrLog)) {
            try {
                const content = fs.readFileSync(stderrLog, 'utf8');
                const allLines = content.split('\n').filter(l => l);
                logs.stderr = allLines.slice(-lines);
            } catch (error) {
                logs.stderr = [];
            }
        } else {
            logs.stderr = [];
        }

        return logs;
    }
}

module.exports = { Launcher };
