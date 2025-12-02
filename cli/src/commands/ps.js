/**
 * PS command - Show process status (like docker ps or kubectl get pods)
 */

const chalk = require('chalk');
const { colors, formatKeyValue } = require('../utils/colors');
const api = require('../utils/api');

async function psCommand(serviceName, options) {
    try {
        if (serviceName) {
            // Show single service status
            const status = await api.getStatus(serviceName);

            console.log('');
            console.log(chalk.bold.cyan(`📊 ${status.serviceName}`));
            console.log(chalk.gray('─'.repeat(60)));
            console.log('');

            const statusColor = status.status === 'running' ? chalk.green
                : status.status === 'stopped' ? chalk.gray
                : chalk.red;

            console.log(formatKeyValue('Status', statusColor(status.status.toUpperCase()), 'core'));
            console.log(formatKeyValue('Port', status.port, 'core'));
            console.log(formatKeyValue('Project', status.project, 'core'));
            console.log(formatKeyValue('PID', status.pid || 'N/A', 'core'));
            console.log(formatKeyValue('Auto-restart', status.autoRestart ? 'Yes' : 'No', 'core'));
            console.log('');

            if (status.command) {
                console.log(chalk.cyan('Command:'));
                console.log(chalk.gray(`  ${status.command}`));
                console.log('');
            }

            if (status.startedAt) {
                console.log(formatKeyValue('Started', status.startedAt, 'core'));
            }

            if (status.stoppedAt && status.status !== 'running') {
                console.log(formatKeyValue('Stopped', status.stoppedAt, 'core'));
            }

            console.log('');
            console.log(chalk.gray('Logs:'));
            console.log(chalk.gray(`  stdout: ${status.logs.stdout}`));
            console.log(chalk.gray(`  stderr: ${status.logs.stderr}`));
            console.log('');

        } else {
            // Show all services
            const { runningOnly } = options;
            const { services, count } = await api.getAllStatuses(runningOnly);

            if (count === 0) {
                console.log(chalk.yellow(runningOnly ? 'No running services' : 'No services found'));
                return;
            }

            console.log(chalk.bold(`\n📊 Services (${count}):\n`));
            console.log(chalk.gray('─'.repeat(100)));

            // Header
            console.log(
                chalk.cyan('SERVICE'.padEnd(25)),
                chalk.cyan('STATUS'.padEnd(12)),
                chalk.cyan('PORT'.padEnd(8)),
                chalk.cyan('PID'.padEnd(10)),
                chalk.cyan('PROJECT'.padEnd(20))
            );
            console.log(chalk.gray('─'.repeat(100)));

            // Services
            services.forEach(s => {
                const statusColor = s.status === 'running' ? chalk.green
                    : s.status === 'stopped' ? chalk.gray
                    : chalk.red;

                const status = statusColor(s.status.toUpperCase().padEnd(12));

                console.log(
                    chalk.white(s.serviceName.padEnd(25)),
                    status,
                    chalk.cyan(s.port.toString().padEnd(8)),
                    chalk.gray((s.pid || 'N/A').toString().padEnd(10)),
                    chalk.dim(s.project.padEnd(20))
                );
            });

            console.log(chalk.gray('─'.repeat(100)));
            console.log(chalk.gray(`\nTotal: ${count} service(s)`));

            const running = services.filter(s => s.status === 'running').length;
            if (running > 0) {
                console.log(chalk.green(`Running: ${running}`));
            }

            console.log('');
        }

    } catch (error) {
        // Error handled by API client
    }
}

module.exports = psCommand;
