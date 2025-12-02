/**
 * Launch command - Launch a service with its allocated port
 */

const chalk = require('chalk');
const boxen = require('boxen');
const { colors, formatKeyValue } = require('../utils/colors');
const api = require('../utils/api');

async function launchCommand(serviceName, options) {
    try {
        const { command, cwd, env, autoRestart } = options;

        if (!command) {
            console.error(chalk.red('❌ Error: --command is required'));
            console.error(chalk.gray('   Example: portauth launch my-service --command "npm start"'));
            process.exit(1);
        }

        // Parse env variables if provided
        let envVars = {};
        if (env) {
            env.split(',').forEach(pair => {
                const [key, value] = pair.split('=');
                if (key && value) {
                    envVars[key.trim()] = value.trim();
                }
            });
        }

        console.log(chalk.yellow('🚀 Launching service...'));

        const result = await api.launch(serviceName, {
            command,
            cwd,
            env: envVars,
            autoRestart: autoRestart || false,
            captureOutput: true
        });

        // Create success message box
        const message = [
            colors.status.success + ' ' + chalk.bold.white('Service Launched Successfully!'),
            '',
            formatKeyValue('Service', result.serviceName, 'core'),
            formatKeyValue('Port', chalk.bold(result.port), 'core'),
            formatKeyValue('PID', result.pid, 'core'),
            formatKeyValue('Status', chalk.green(result.status), 'core'),
            '',
            chalk.gray('Command:'),
            chalk.cyan(`  ${command}`),
            '',
            chalk.yellow.bold('📋 View logs:'),
            chalk.cyan(`  portauth logs ${serviceName}`),
            '',
            chalk.yellow.bold('🔍 Check status:'),
            chalk.cyan(`  portauth ps ${serviceName}`)
        ].join('\n');

        console.log(boxen(message, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green'
        }));

    } catch (error) {
        // Error handled by API client
    }
}

module.exports = launchCommand;
