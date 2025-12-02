#!/usr/bin/env node

/**
 * Port Authority CLI - Command-line interface for port management
 */

const { Command } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

const PORT_AUTHORITY_URL = process.env.PORT_AUTHORITY_URL || 'http://localhost:9999';

const program = new Command();

program
    .name('portauth')
    .description('Port Authority CLI - Centralized port management')
    .version('1.0.0');

// Allocate command
program
    .command('allocate <service-name>')
    .description('Allocate a port for a service')
    .option('-p, --preferred <port>', 'Preferred port number')
    .option('--priority <priority>', 'Allocation priority (1-5)', '1')
    .option('--project <project>', 'Project name', 'default')
    .action(async (serviceName, options) => {
        try {
            const response = await axios.post(`${PORT_AUTHORITY_URL}/allocate`, {
                serviceName,
                preferredPort: options.preferred ? parseInt(options.preferred) : undefined,
                priority: parseInt(options.priority),
                project: options.project
            });

            const allocation = response.data;
            console.log(chalk.green('✅ Port allocated successfully!'));
            console.log('');
            console.log(chalk.cyan('Service:'), allocation.serviceName);
            console.log(chalk.cyan('Port:'), chalk.bold(allocation.port));
            console.log(chalk.cyan('Project:'), allocation.project);
            console.log(chalk.cyan('φ-Optimized:'), allocation.phiOptimized ? '✓' : '✗');
            console.log('');
            console.log(chalk.yellow('Use this port in your service:'));
            console.log(chalk.gray(`  export PORT=${allocation.port}`));
            console.log(chalk.gray(`  const port = ${allocation.port};`));
        } catch (error) {
            console.error(chalk.red('❌ Failed to allocate port:'), error.response?.data?.error || error.message);
            process.exit(1);
        }
    });

// Release command
program
    .command('release <service-name>')
    .description('Release a port allocation')
    .action(async (serviceName) => {
        try {
            await axios.post(`${PORT_AUTHORITY_URL}/release`, { serviceName });
            console.log(chalk.green(`✅ Port released for ${serviceName}`));
        } catch (error) {
            console.error(chalk.red('❌ Failed to release port:'), error.response?.data?.error || error.message);
            process.exit(1);
        }
    });

// List command
program
    .command('list')
    .description('List all port allocations')
    .option('-p, --project <project>', 'Filter by project')
    .action(async (options) => {
        try {
            const response = await axios.get(`${PORT_AUTHORITY_URL}/allocations`);
            let allocations = response.data;

            if (options.project) {
                allocations = allocations.filter(a => a.project === options.project);
            }

            if (allocations.length === 0) {
                console.log(chalk.yellow('No allocations found'));
                return;
            }

            console.log(chalk.bold('\n📋 Port Allocations:\n'));
            console.log(chalk.gray('─'.repeat(80)));

            allocations.forEach(alloc => {
                const phi = alloc.phiOptimized ? chalk.yellow('φ') : ' ';
                console.log(
                    chalk.cyan(alloc.port.toString().padEnd(6)),
                    phi,
                    chalk.white(alloc.serviceName.padEnd(30)),
                    chalk.gray(alloc.project.padEnd(15)),
                    chalk.dim(alloc.allocatedAt)
                );
            });

            console.log(chalk.gray('─'.repeat(80)));
            console.log(chalk.gray(`\nTotal: ${allocations.length} allocations`));
        } catch (error) {
            console.error(chalk.red('❌ Failed to list allocations:'), error.message);
            process.exit(1);
        }
    });

// Check command
program
    .command('check <port>')
    .description('Check if a port is available')
    .action(async (port) => {
        try {
            const response = await axios.get(`${PORT_AUTHORITY_URL}/check/${port}`);
            const { available } = response.data;

            if (available) {
                console.log(chalk.green(`✅ Port ${port} is available`));
            } else {
                console.log(chalk.red(`❌ Port ${port} is already allocated`));

                // Get who is using it
                const allocResponse = await axios.get(`${PORT_AUTHORITY_URL}/allocations`);
                const allocation = allocResponse.data.find(a => a.port === parseInt(port));
                if (allocation) {
                    console.log(chalk.yellow(`   Allocated to: ${allocation.serviceName} (${allocation.project})`));
                }
            }
        } catch (error) {
            console.error(chalk.red('❌ Error checking port:'), error.message);
            process.exit(1);
        }
    });

// Enforce command
program
    .command('enforce')
    .description('Enforce port authority - kill unauthorized processes')
    .action(async () => {
        try {
            console.log(chalk.yellow('⚡ Enforcing port authority...'));
            const response = await axios.post(`${PORT_AUTHORITY_URL}/enforce`);
            const { violations, killed } = response.data;

            if (killed === 0) {
                console.log(chalk.green('✅ No violations detected - all ports authorized'));
            } else {
                console.log(chalk.red(`⚠️  Killed ${killed} unauthorized process(es)`));
                violations.forEach(v => {
                    console.log(chalk.gray(`   Port ${v.port}: PID ${v.pid}`));
                });
            }
        } catch (error) {
            console.error(chalk.red('❌ Enforcement failed:'), error.message);
            process.exit(1);
        }
    });

// Metrics command
program
    .command('metrics')
    .description('Show Port Authority metrics')
    .action(async () => {
        try {
            const response = await axios.get(`${PORT_AUTHORITY_URL}/metrics`);
            const metrics = response.data;

            console.log(chalk.bold('\n📊 Port Authority Metrics:\n'));
            console.log(chalk.cyan('Total Allocations:'), metrics.totalAllocations);
            console.log(chalk.cyan('Active Allocations:'), metrics.activeAllocations);
            console.log(chalk.cyan('φ-Optimized:'), metrics.phiOptimized);
            console.log(chalk.cyan('Port Range:'), `${metrics.portRange.start} - ${metrics.portRange.end}`);
            console.log('');
            console.log(chalk.bold('By Project:'));
            Object.entries(metrics.byProject).forEach(([project, count]) => {
                console.log(chalk.gray(`  ${project}:`), count);
            });
        } catch (error) {
            console.error(chalk.red('❌ Failed to get metrics:'), error.message);
            process.exit(1);
        }
    });

// Health command
program
    .command('health')
    .description('Check Port Authority service health')
    .action(async () => {
        try {
            const response = await axios.get(`${PORT_AUTHORITY_URL}/health`);
            const health = response.data;

            console.log(chalk.green('✅ Port Authority is healthy'));
            console.log(chalk.cyan('Uptime:'), `${Math.floor(health.uptime)}s`);
            console.log(chalk.cyan('Allocations:'), health.allocations);
        } catch (error) {
            console.error(chalk.red('❌ Port Authority is not responding'));
            console.error(chalk.gray(`   Make sure the service is running: npm start`));
            process.exit(1);
        }
    });

// Discover command
program
    .command('discover')
    .description('Discover all services using ports')
    .option('--start <port>', 'Start of port range', '1000')
    .option('--end <port>', 'End of port range', '65535')
    .option('--registered', 'Include already registered services')
    .option('--register', 'Auto-register discovered services')
    .option('--force', 'Kill services before registering them')
    .option('--project <project>', 'Project name for registered services', 'discovered')
    .action(async (options) => {
        try {
            console.log(chalk.yellow('🔍 Discovering services...'));
            console.log(chalk.gray(`   Scanning ports ${options.start}-${options.end}`));
            console.log('');

            // Discover services
            const response = await axios.get(`${PORT_AUTHORITY_URL}/discover`, {
                params: {
                    start: options.start,
                    end: options.end,
                    includeRegistered: options.registered || false
                }
            });

            const { services, count } = response.data;

            if (count === 0) {
                console.log(chalk.yellow('No services found'));
                return;
            }

            console.log(chalk.bold(`📋 Discovered ${count} service(s):\n`));
            console.log(chalk.gray('─'.repeat(100)));

            services.forEach(service => {
                const status = service.registered
                    ? chalk.green('[REGISTERED]')
                    : chalk.red('[UNREGISTERED]');

                const serviceName = service.registered
                    ? service.registeredAs
                    : service.inferredServiceName;

                console.log(
                    chalk.cyan(service.port.toString().padEnd(6)),
                    status.padEnd(25),
                    chalk.white(serviceName.padEnd(25)),
                    chalk.gray(`PID: ${service.pid || 'N/A'}`.padEnd(15)),
                    chalk.dim(service.user)
                );
                console.log(chalk.gray(`       ${service.command.substring(0, 80)}`));
                console.log('');
            });

            console.log(chalk.gray('─'.repeat(100)));
            console.log(chalk.gray(`Total: ${count} services`));

            // Auto-register if requested
            if (options.register || options.force) {
                console.log('');
                console.log(chalk.yellow('⚡ Registering discovered services...'));

                const registerResponse = await axios.post(`${PORT_AUTHORITY_URL}/discover/register-all`, {
                    portRangeStart: parseInt(options.start),
                    portRangeEnd: parseInt(options.end),
                    kill: options.force || false,
                    project: options.project
                });

                const { total, succeeded, failed, alreadyRegistered } = registerResponse.data;

                console.log('');
                console.log(chalk.green(`✅ Registered: ${succeeded}`));
                if (alreadyRegistered > 0) {
                    console.log(chalk.blue(`ℹ️  Already registered: ${alreadyRegistered}`));
                }
                if (failed > 0) {
                    console.log(chalk.red(`❌ Failed: ${failed}`));
                }

                if (options.force) {
                    console.log('');
                    console.log(chalk.yellow('⚠️  Services were killed during registration'));
                }
            } else {
                console.log('');
                console.log(chalk.gray('Tip: Use --register to auto-register these services'));
                console.log(chalk.gray('     Use --force to kill and register services'));
            }

        } catch (error) {
            console.error(chalk.red('❌ Discovery failed:'), error.response?.data?.error || error.message);
            process.exit(1);
        }
    });

// Doctor command - system health diagnostics
program
    .command('doctor')
    .description('Run system diagnostics and health checks')
    .action(async () => {
        console.log(chalk.bold('\n🏥 Port Authority Doctor\n'));
        console.log(chalk.gray('Running diagnostics...\n'));

        let allHealthy = true;

        // Check 1: Service health
        console.log(chalk.cyan('1. Checking Port Authority service...'));
        try {
            const response = await axios.get(`${PORT_AUTHORITY_URL}/health`);
            console.log(chalk.green('   ✅ Service is running'));
            console.log(chalk.gray(`      Uptime: ${Math.floor(response.data.uptime)}s`));
            console.log(chalk.gray(`      Allocations: ${response.data.allocations}`));
        } catch (error) {
            console.log(chalk.red('   ❌ Service is not responding'));
            console.log(chalk.gray('      Make sure to run: npm start'));
            allHealthy = false;
        }

        // Check 2: System dependencies
        console.log(chalk.cyan('\n2. Checking system dependencies...'));
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);

        const deps = [
            { name: 'lsof', cmd: 'which lsof' },
            { name: 'ss', cmd: 'which ss' },
            { name: 'ps', cmd: 'which ps' },
            { name: 'kill', cmd: 'which kill' }
        ];

        for (const dep of deps) {
            try {
                await execAsync(dep.cmd);
                console.log(chalk.green(`   ✅ ${dep.name} is available`));
            } catch (error) {
                console.log(chalk.red(`   ❌ ${dep.name} is not available`));
                allHealthy = false;
            }
        }

        // Check 3: Port conflicts
        console.log(chalk.cyan('\n3. Checking for port conflicts...'));
        try {
            const response = await axios.get(`${PORT_AUTHORITY_URL}/discover?includeRegistered=true`);
            const services = response.data.services;
            const conflicts = services.filter(s => s.registered);

            if (conflicts.length === 0) {
                console.log(chalk.yellow('   ⚠️  No registered services found'));
            } else {
                console.log(chalk.green(`   ✅ ${conflicts.length} services properly registered`));
            }

            const unregistered = services.filter(s => !s.registered);
            if (unregistered.length > 0) {
                console.log(chalk.yellow(`   ⚠️  ${unregistered.length} unregistered services detected`));
                console.log(chalk.gray('      Run "portauth discover --register" to fix'));
            }
        } catch (error) {
            console.log(chalk.red('   ❌ Could not check for conflicts'));
            allHealthy = false;
        }

        // Check 4: Registry database
        console.log(chalk.cyan('\n4. Checking registry database...'));
        try {
            const response = await axios.get(`${PORT_AUTHORITY_URL}/allocations`);
            console.log(chalk.green('   ✅ Registry is accessible'));
            console.log(chalk.gray(`      Total allocations: ${response.data.length}`));
        } catch (error) {
            console.log(chalk.red('   ❌ Registry is not accessible'));
            allHealthy = false;
        }

        // Final verdict
        console.log('');
        console.log(chalk.gray('─'.repeat(50)));
        if (allHealthy) {
            console.log(chalk.green('\n✅ All systems operational!\n'));
        } else {
            console.log(chalk.red('\n❌ Issues detected. Please fix the problems above.\n'));
            process.exit(1);
        }
    });

program.parse();
