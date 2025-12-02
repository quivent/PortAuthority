/**
 * Scan command - Scan for port conflicts
 */

const chalk = require('chalk');
const ora = require('ora');
const { colors, createHeader } = require('../utils/colors');
const { createAllocationTable, formatAllocationRow } = require('../utils/table');
const api = require('../utils/api');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function scanCommand(options) {
    const spinner = ora({
        text: 'Scanning for port conflicts...',
        color: 'yellow'
    }).start();

    try {
        // Get all allocations
        const allocations = await api.getAllocations(options.project);

        // Parse range
        let startPort = 3000;
        let endPort = 9999;

        if (options.range) {
            const [start, end] = options.range.split('-').map(Number);
            startPort = start;
            endPort = end;
        }

        // Check which ports are actually in use on the system
        spinner.text = 'Checking system ports...';

        let portsInUse = [];
        try {
            // Try to get listening ports (works on Linux/Mac)
            const { stdout } = await execAsync('netstat -tuln 2>/dev/null || ss -tuln 2>/dev/null || true');
            const lines = stdout.split('\n');

            lines.forEach(line => {
                const match = line.match(/:(\d+)\s/);
                if (match) {
                    const port = parseInt(match[1]);
                    if (port >= startPort && port <= endPort) {
                        portsInUse.push(port);
                    }
                }
            });
        } catch (error) {
            // Silently fail if netstat/ss not available
        }

        portsInUse = [...new Set(portsInUse)].sort((a, b) => a - b);

        spinner.succeed('Scan complete');

        // Find conflicts (ports in use but not in Port Authority)
        const allocatedPorts = new Set(allocations.map(a => a.port));
        const conflicts = portsInUse.filter(port => !allocatedPorts.has(port));

        // Find authorized but not in use
        const authorizedNotInUse = allocations.filter(a => !portsInUse.includes(a.port));

        // Display results
        console.log(createHeader('🔍 Port Scan Results'));

        console.log(chalk.bold.white(`Scan Range: ${startPort} - ${endPort}`));
        console.log('');

        // Summary
        console.log(colors.utility.accent('Ports In Use:'), chalk.white(portsInUse.length));
        console.log(colors.utility.accent('Authorized Ports:'), chalk.white(allocations.length));
        console.log(colors.utility.accent('Conflicts:'), conflicts.length > 0 ? chalk.red.bold(conflicts.length) : chalk.green('0'));
        console.log('');

        // Show conflicts
        if (conflicts.length > 0) {
            console.log(colors.status.warning + ' ' + chalk.yellow.bold('Unauthorized Ports Detected:'));
            console.log('');

            conflicts.forEach(port => {
                console.log(
                    '  ' + colors.status.error + ' ' +
                    chalk.red.bold(port) + ' ' +
                    chalk.gray('(not authorized by Port Authority)')
                );
            });

            console.log('');
            console.log(chalk.yellow('💡 Run ') + chalk.cyan.bold('portauth enforce') + chalk.yellow(' to kill unauthorized processes'));
            console.log('');
        } else {
            console.log(colors.status.success + ' ' + chalk.green.bold('No conflicts detected!'));
            console.log(chalk.gray('   All ports in use are properly authorized'));
            console.log('');
        }

        // Show authorized but not in use
        if (authorizedNotInUse.length > 0) {
            console.log(chalk.bold.white('📋 Authorized but Not In Use:'));
            console.log(chalk.gray(`   ${authorizedNotInUse.length} allocated port${authorizedNotInUse.length !== 1 ? 's' : ''} not currently in use`));
            console.log('');

            if (authorizedNotInUse.length <= 10) {
                const table = createAllocationTable('utility');
                authorizedNotInUse.forEach(allocation => {
                    table.push(formatAllocationRow(allocation));
                });
                console.log(table.toString());
                console.log('');
            }
        }

    } catch (error) {
        spinner.fail('Scan failed');
        throw error;
    }
}

module.exports = scanCommand;
