/**
 * Logs command - View service logs
 */

const chalk = require('chalk');
const api = require('../utils/api');

async function logsCommand(serviceName, options) {
    try {
        const { lines, follow } = options;
        const numLines = parseInt(lines) || 50;

        if (follow) {
            console.log(chalk.yellow(`📜 Following logs for ${serviceName} (Ctrl+C to stop)...`));
            console.log('');

            // Initial fetch
            await displayLogs(serviceName, numLines);

            // Poll for new logs every 2 seconds
            setInterval(async () => {
                await displayLogs(serviceName, numLines);
            }, 2000);

        } else {
            await displayLogs(serviceName, numLines);
        }

    } catch (error) {
        // Error handled by API client
    }
}

async function displayLogs(serviceName, lines) {
    const logs = await api.getLogs(serviceName, lines);

    if (logs.stdout.length > 0) {
        console.log(chalk.bold.cyan('📋 STDOUT:'));
        console.log(chalk.gray('─'.repeat(80)));
        logs.stdout.forEach(line => {
            console.log(line);
        });
        console.log('');
    }

    if (logs.stderr.length > 0) {
        console.log(chalk.bold.red('⚠️  STDERR:'));
        console.log(chalk.gray('─'.repeat(80)));
        logs.stderr.forEach(line => {
            console.log(chalk.red(line));
        });
        console.log('');
    }

    if (logs.stdout.length === 0 && logs.stderr.length === 0) {
        console.log(chalk.yellow('No logs available'));
    }
}

module.exports = logsCommand;
