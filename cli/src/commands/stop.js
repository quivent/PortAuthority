/**
 * Stop command - Stop a running service
 */

const chalk = require('chalk');
const { colors, formatKeyValue } = require('../utils/colors');
const api = require('../utils/api');

async function stopCommand(serviceName, options) {
    try {
        const { force } = options;

        console.log(chalk.yellow(`⏹️  Stopping ${serviceName}...`));

        const result = await api.stop(serviceName, force);

        console.log('');
        console.log(colors.status.success + ' ' + chalk.bold('Service stopped successfully'));
        console.log(formatKeyValue('Service', result.serviceName, 'core'));
        console.log(formatKeyValue('PID', result.pid, 'core'));
        console.log(formatKeyValue('Status', chalk.gray(result.status), 'core'));
        console.log('');

    } catch (error) {
        // Error handled by API client
    }
}

module.exports = stopCommand;
