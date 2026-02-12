#!/usr/bin/env node
/**
 * Port Authority - Daemon Manager
 * Usage: node daemon.js start|stop|status|restart|logs
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT_DIR = __dirname;
const PID_FILE = path.join(ROOT_DIR, '.port-authority.pid');
const LOG_FILE = path.join(ROOT_DIR, '.port-authority.log');
const SERVICE_PORT = process.env.PORT_AUTHORITY_PORT || 9999;

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[Port Authority]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[Port Authority]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[Port Authority]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[Port Authority]${colors.reset} ${msg}`)
};

function getPid() {
  try {
    return parseInt(fs.readFileSync(PID_FILE, 'utf8').trim());
  } catch {
    return null;
  }
}

function isRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function isDaemonRunning() {
  const pid = getPid();
  return isRunning(pid);
}

async function start() {
  if (isDaemonRunning()) {
    log.warn(`Daemon already running (PID: ${getPid()})`);
    return false;
  }

  log.info('Starting Port Authority daemon...');

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
  await new Promise(r => setTimeout(r, 1000));

  if (isRunning(child.pid)) {
    log.success(`Daemon started (PID: ${child.pid})`);
    log.info(`API: http://localhost:${SERVICE_PORT}`);
    log.info(`Logs: ${LOG_FILE}`);
    return true;
  } else {
    log.error(`Failed to start. Check logs: ${LOG_FILE}`);
    try { fs.unlinkSync(PID_FILE); } catch {}
    return false;
  }
}

function stop() {
  const pid = getPid();

  if (!isRunning(pid)) {
    log.warn('Daemon is not running');
    try { fs.unlinkSync(PID_FILE); } catch {}
    return false;
  }

  log.info(`Stopping daemon (PID: ${pid})...`);

  try {
    process.kill(pid, 'SIGTERM');

    // Wait for graceful shutdown
    let attempts = 0;
    while (isRunning(pid) && attempts < 20) {
      execSync('sleep 0.25');
      attempts++;
    }

    if (isRunning(pid)) {
      log.warn('Forcing shutdown...');
      process.kill(pid, 'SIGKILL');
    }
  } catch (err) {
    log.error(`Error stopping: ${err.message}`);
  }

  try { fs.unlinkSync(PID_FILE); } catch {}
  log.success('Daemon stopped');
  return true;
}

async function restart() {
  stop();
  await new Promise(r => setTimeout(r, 500));
  return start();
}

function status() {
  const pid = getPid();

  if (isRunning(pid)) {
    log.success(`Daemon is running (PID: ${pid})`);
    log.info(`API: http://localhost:${SERVICE_PORT}`);

    // Check health
    const req = http.get(`http://localhost:${SERVICE_PORT}/health`, { timeout: 2000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          log.info(`Status: ${health.status}`);
        } catch {}
      });
    });
    req.on('error', () => {});

    return true;
  } else {
    log.warn('Daemon is not running');
    return false;
  }
}

function logs(lines = 50) {
  if (!fs.existsSync(LOG_FILE)) {
    log.warn('No log file found');
    return;
  }

  log.info(`Last ${lines} lines of logs:\n`);

  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const allLines = content.split('\n');
    const lastLines = allLines.slice(-lines).join('\n');
    console.log(lastLines);
  } catch (err) {
    log.error(`Error reading logs: ${err.message}`);
  }
}

function help() {
  console.log(`
${colors.cyan}Port Authority${colors.reset} - Daemon Manager

Usage: node daemon.js <command>

Commands:
  start       Start the daemon in background
  stop        Stop the daemon
  restart     Restart the daemon
  status      Show daemon status
  logs [N]    Show last N lines of logs (default: 50)
  help        Show this help

Examples:
  node daemon.js start
  node daemon.js status
  node daemon.js logs 100

After starting, use 'portauth' CLI:
  portauth list
  portauth allocate my-service --preferred 8080
  portauth health
`);
}

// Main
const command = process.argv[2] || 'help';
const arg = process.argv[3];

(async () => {
  switch (command) {
    case 'start':
      await start();
      break;
    case 'stop':
      stop();
      break;
    case 'restart':
      await restart();
      break;
    case 'status':
      status();
      break;
    case 'logs':
      logs(parseInt(arg) || 50);
      break;
    case 'help':
    case '--help':
    case '-h':
      help();
      break;
    default:
      log.error(`Unknown command: ${command}`);
      help();
      process.exit(1);
  }
})();
