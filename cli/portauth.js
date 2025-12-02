#!/usr/bin/env node

/**
 * Port Authority CLI - Enhanced command-line interface for port management
 * Beautiful design with color-grouped commands, tree visualization, and comprehensive docs
 */

const { Command } = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');
const { gradients } = require('./src/utils/colors');

// Import commands
const allocateCommand = require('./src/commands/allocate');
const releaseCommand = require('./src/commands/release');
const checkCommand = require('./src/commands/check');
const listCommand = require('./src/commands/list');
const metricsCommand = require('./src/commands/metrics');
const healthCommand = require('./src/commands/health');
const treeCommand = require('./src/commands/tree');
const docsCommand = require('./src/commands/docs');
const statsCommand = require('./src/commands/stats');
const scanCommand = require('./src/commands/scan');
const watchCommand = require('./src/commands/watch');
const exportCommand = require('./src/commands/export');
const enforceCommand = require('./src/commands/enforce');
const launchCommand = require('./src/commands/launch');
const autoLaunchCommand = require('./src/commands/auto-launch');
const stopCommand = require('./src/commands/stop');
const restartCommand = require('./src/commands/restart');
const psCommand = require('./src/commands/ps');
const logsCommand = require('./src/commands/logs');
const domainsProgram = require('./src/commands/domains');

const program = new Command();

// Custom help with tree
program.configureHelp({
    showGlobalOptions: true
});

program
    .name('portauth')
    .description('Port Authority CLI - Centralized port management with φ-optimization')
    .version('2.0.0')
    .addHelpText('beforeAll', () => {
        const banner = boxen(
            gradients.ocean('PORT AUTHORITY CLI v2.0') + '\n' +
            chalk.gray('Centralized port management with golden ratio optimization'),
            {
                padding: 1,
                margin: { top: 1, bottom: 1 },
                borderStyle: 'round',
                borderColor: 'cyan'
            }
        );
        return banner;
    })
    .addHelpText('after', () => {
        return '\n' + chalk.gray('Run ') + chalk.cyan.bold('portauth tree') + chalk.gray(' to see all commands organized by category\n') +
               chalk.gray('Run ') + chalk.cyan.bold('portauth docs') + chalk.gray(' to view comprehensive documentation\n');
    });

// 🔵 CORE COMMANDS
program
    .command('allocate <service-name>')
    .description(chalk.blue('🔵 ') + 'Allocate a port for a service')
    .option('-p, --preferred <port>', 'Preferred port number')
    .option('--priority <priority>', 'Allocation priority (1-5)', '1')
    .option('--project <project>', 'Project name', 'default')
    .action(allocateCommand);

program
    .command('release <service-name>')
    .description(chalk.blue('🔵 ') + 'Release a port allocation')
    .action(releaseCommand);

program
    .command('check <port>')
    .description(chalk.blue('🔵 ') + 'Check if a port is available')
    .action(checkCommand);

// 🟢 MANAGEMENT COMMANDS
program
    .command('list')
    .description(chalk.green('🟢 ') + 'List all port allocations')
    .option('-p, --project <project>', 'Filter by project')
    .action(listCommand);

program
    .command('metrics')
    .description(chalk.green('🟢 ') + 'Show Port Authority metrics')
    .action(metricsCommand);

program
    .command('health')
    .description(chalk.green('🟢 ') + 'Check Port Authority service health')
    .action(healthCommand);

// 🟡 UTILITY COMMANDS
program
    .command('tree')
    .description(chalk.yellow('🟡 ') + 'Show command hierarchy tree')
    .action(treeCommand);

program
    .command('docs')
    .description(chalk.yellow('🟡 ') + 'Show documentation')
    .option('--web', 'Open documentation in browser')
    .option('--glow', 'Render documentation with glow')
    .action(docsCommand);

program
    .command('stats')
    .description(chalk.yellow('🟡 ') + 'Show detailed statistics')
    .option('-p, --project <project>', 'Filter by project')
    .action(statsCommand);

program
    .command('scan')
    .description(chalk.yellow('🟡 ') + 'Scan for port conflicts')
    .option('--range <start-end>', 'Port range to scan (e.g., 3000-9999)')
    .option('-p, --project <project>', 'Filter by project')
    .action(scanCommand);

program
    .command('watch')
    .description(chalk.yellow('🟡 ') + 'Watch allocations in real-time')
    .option('-i, --interval <seconds>', 'Refresh interval in seconds', '5')
    .option('-p, --project <project>', 'Filter by project')
    .action(watchCommand);

program
    .command('export')
    .description(chalk.yellow('🟡 ') + 'Export allocations to file')
    .option('-f, --format <format>', 'Export format (json, csv, yaml)', 'json')
    .option('-o, --output <file>', 'Output file name')
    .option('-p, --project <project>', 'Filter by project')
    .action(exportCommand);

// 🔴 ADMINISTRATION COMMANDS
program
    .command('enforce')
    .description(chalk.red('🔴 ') + 'Kill unauthorized processes on allocated ports')
    .action(enforceCommand);

// 🟣 LAUNCHER COMMANDS (Process Management)
program
    .command('launch <service-name>')
    .description(chalk.magenta('🟣 ') + 'Launch a service with its allocated port')
    .requiredOption('-c, --command <command>', 'Command to run')
    .option('--cwd <directory>', 'Working directory')
    .option('--env <vars>', 'Environment variables (e.g., "VAR1=value1,VAR2=value2")')
    .option('--auto-restart', 'Auto-restart on crash')
    .action(launchCommand);

program
    .command('up')
    .description(chalk.magenta('🟣 ') + 'Auto-detect and launch service in current directory')
    .option('-n, --name <service-name>', 'Override service name (defaults to directory name)')
    .option('-p, --project <project>', 'Project name', 'auto')
    .option('--auto-restart', 'Auto-restart on crash')
    .action(autoLaunchCommand);

program
    .command('stop <service-name>')
    .description(chalk.magenta('🟣 ') + 'Stop a running service')
    .option('-f, --force', 'Force kill (SIGKILL instead of SIGTERM)')
    .action(stopCommand);

program
    .command('restart <service-name>')
    .description(chalk.magenta('🟣 ') + 'Restart a service')
    .action(restartCommand);

program
    .command('ps [service-name]')
    .description(chalk.magenta('🟣 ') + 'Show process status of services')
    .option('--running-only', 'Show only running services')
    .action(psCommand);

program
    .command('logs <service-name>')
    .description(chalk.magenta('🟣 ') + 'View service logs')
    .option('-n, --lines <number>', 'Number of lines to show', '50')
    .option('-f, --follow', 'Follow log output')
    .action(logsCommand);

// 🌐 DOMAIN MANAGEMENT COMMANDS
program
    .addCommand(domainsProgram
        .name('domains')
        .description(chalk.cyan('🌐 ') + 'Manage domain-to-service mappings')
    );

// Handle no command (show help)
if (process.argv.length === 2) {
    program.help();
}

// Parse and execute
program.parse();
