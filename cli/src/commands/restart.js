/**
 * Restart command - Restart a service
 */

const chalk = require('chalk');
const boxen = require('boxen');
const { colors, formatKeyValue } = require('../utils/colors');
const api = require('../utils/api');

async function restartCommand(serviceName) {
    try {
        console.log(chalk.yellow(`🔄 Restarting ${serviceName}...`));

        const result = await api.restart(serviceName);

        // Create success message box
        const message = [
            colors.status.success + ' ' + chalk.bold.white('Service Restarted Successfully!'),
            '',
            formatKeyValue('Service', result.serviceName, 'core'),
            formatKeyValue('Port', chalk.bold(result.port), 'core'),
            formatKeyValue('PID', result.pid, 'core'),
            formatKeyValue('Status', chalk.green(result.status), 'core')
        ].join('\n');

        console.log(boxen(message, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'yellow'
        }));

    } catch (error) {
        // Error handled by API client
    }
}

module.exports = restartCommand;
