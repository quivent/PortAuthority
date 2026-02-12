/**
 * Daemon command - Manage the Port Authority background service
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const chalk = require('chalk');
const boxen = require('boxen');
const ora = require('ora');
const { api } = require('../utils/api');

// Find the root directory (where service/index.js lives)
function findRootDir() {
  // Try common locations
  const candidates = [
    path.resolve(__dirname, '../../../../'),  // From cli/src/commands
    path.resolve(__dirname, '../../../'),
    process.env.PORT_AUTHORITY_HOME,
    '/usr/local/share/port-authority',
    path.join(process.env.HOME || '', 'PortAuthority'),
    path.join(process.env.HOME || '', 'port-authority')
  ].filter(Boolean);

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'service', 'index.js'))) {
      return dir;
    }
  }

  return null;
}

const ROOT_DIR = findRootDir();
const PID_FILE = ROOT_DIR ? path.join(ROOT_DIR, '.port-authority.pid') : null;
const LOG_FILE = ROOT_DIR ? path.join(ROOT_DIR, '.port-authority.log') : null;
const SERVICE_PORT = process.env.PORT_AUTHORITY_PORT || 9999;

function getPid() {
  try {
    return parseInt(fs.readFileSync(PID_FILE, 'utf8').trim());
  } catch {
    return null;
  }
}

function isProcessRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function checkApiHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${SERVICE_PORT}/health`, { timeout: 2000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
  });
}

async function startDaemon() {
  if (!ROOT_DIR) {
    console.log(chalk.red('Error: Could not find Port Authority installation'));
    console.log(chalk.gray('Set PORT_AUTHORITY_HOME environment variable or install properly'));
    return false;
  }

  // Check if already running
  const health = await checkApiHealth();
  if (health) {
    console.log(chalk.yellow('Daemon is already running'));
    console.log(chalk.gray(`API: http://localhost:${SERVICE_PORT}`));
    return true;
  }

  const spinner = ora('Starting Port Authority daemon...').start();

  try {
    const logStream = fs.openSync(LOG_FILE, 'a');

    const child = spawn('node', ['service/index.js'], {
      cwd: ROOT_DIR,
      detached: true,
      stdio: ['ignore', logStream, logStream],
      env: { ...process.env }
    });

    fs.writeFileSync(PID_FILE, String(child.pid));
    child.unref();

    // Wait and verify
    await new Promise(r => setTimeout(r, 1500));

    const healthCheck = await checkApiHealth();
    if (healthCheck) {
      spinner.succeed(chalk.green(`Daemon started (PID: ${child.pid})`));
      console.log(chalk.gray(`API: http://localhost:${SERVICE_PORT}`));
      console.log(chalk.gray(`Logs: ${LOG_FILE}`));
      return true;
    } else {
      spinner.fail(chalk.red('Failed to start daemon'));
      console.log(chalk.gray(`Check logs: ${LOG_FILE}`));
      return false;
    }
  } catch (err) {
    spinner.fail(chalk.red(`Error: ${err.message}`));
    return false;
  }
}

function stopDaemon() {
  const pid = getPid();

  if (!isProcessRunning(pid)) {
    // Check if API is responding anyway (started differently)
    console.log(chalk.yellow('No tracked daemon process found'));
    try { fs.unlinkSync(PID_FILE); } catch {}
    return false;
  }

  const spinner = ora(`Stopping daemon (PID: ${pid})...`).start();

  try {
    process.kill(pid, 'SIGTERM');

    // Wait for graceful shutdown
    let attempts = 0;
    while (isProcessRunning(pid) && attempts < 20) {
      execSync('sleep 0.25', { stdio: 'ignore' });
      attempts++;
    }

    if (isProcessRunning(pid)) {
      process.kill(pid, 'SIGKILL');
    }

    spinner.succeed(chalk.green('Daemon stopped'));
  } catch (err) {
    spinner.fail(chalk.red(`Error: ${err.message}`));
  }

  try { fs.unlinkSync(PID_FILE); } catch {}
  return true;
}

async function restartDaemon() {
  stopDaemon();
  await new Promise(r => setTimeout(r, 500));
  return startDaemon();
}

async function showStatus() {
  const pid = getPid();
  const health = await checkApiHealth();

  console.log(boxen(
    chalk.cyan.bold('Port Authority Daemon Status'),
    { padding: { left: 2, right: 2 }, borderColor: 'cyan', borderStyle: 'round' }
  ));

  if (health) {
    console.log(chalk.green('  Status:  ') + chalk.green.bold('Running'));
    console.log(chalk.gray('  PID:     ') + (pid || 'unknown'));
    console.log(chalk.gray('  API:     ') + `http://localhost:${SERVICE_PORT}`);
    console.log(chalk.gray('  Uptime:  ') + (health.uptime || 'unknown'));
  } else {
    console.log(chalk.red('  Status:  ') + chalk.red.bold('Stopped'));
    console.log('');
    console.log(chalk.gray('  Start with: ') + chalk.cyan('portauth daemon start'));
  }
}

function showLogs(lines = 50) {
  if (!LOG_FILE || !fs.existsSync(LOG_FILE)) {
    console.log(chalk.yellow('No log file found'));
    return;
  }

  console.log(chalk.cyan(`Last ${lines} lines of logs:\n`));

  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const allLines = content.split('\n');
    const lastLines = allLines.slice(-lines).join('\n');
    console.log(lastLines);
  } catch (err) {
    console.log(chalk.red(`Error reading logs: ${err.message}`));
  }
}

module.exports = async function daemonCommand(action, options = {}) {
  switch (action) {
    case 'start':
      await startDaemon();
      break;
    case 'stop':
      stopDaemon();
      break;
    case 'restart':
      await restartDaemon();
      break;
    case 'status':
      await showStatus();
      break;
    case 'logs':
      showLogs(options.lines || 50);
      break;
    default:
      console.log(chalk.cyan.bold('\nPort Authority Daemon Manager\n'));
      console.log('Usage: portauth daemon <command>\n');
      console.log('Commands:');
      console.log('  start     Start the daemon');
      console.log('  stop      Stop the daemon');
      console.log('  restart   Restart the daemon');
      console.log('  status    Show daemon status');
      console.log('  logs      Show daemon logs');
      console.log('');
  }
};
