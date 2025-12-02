/**
 * Check command - Check if a port is available
 */

const chalk = require('chalk');
const boxen = require('boxen');
const { colors, formatKeyValue } = require('../utils/colors');
const api = require('../utils/api');

async function checkCommand(port) {
    try {
        const { available } = await api.checkPort(port);

        if (available) {
            const message = [
                colors.status.success + ' ' + chalk.bold.white(`Port ${chalk.cyan(port)} is available`),
                '',
                colors.core.accent('Status: ') + chalk.green.bold('FREE'),
                '',
                chalk.gray('You can allocate this port for your service.')
            ].join('\n');

            console.log(boxen(message, {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'green'
            }));
        } else {
            // Get allocation details
            const allocations = await api.getAllocations();
            const allocation = allocations.find(a => a.port === parseInt(port));

            const message = [
                colors.status.error + ' ' + chalk.bold.white(`Port ${chalk.red(port)} is already allocated`),
                '',
                colors.core.accent('Status: ') + chalk.red.bold('IN USE'),
                ''
            ];

            if (allocation) {
                message.push(formatKeyValue('Service', allocation.serviceName, 'core'));
                message.push(formatKeyValue('Project', allocation.project, 'core'));
                message.push(formatKeyValue('Allocated', new Date(allocation.allocatedAt).toLocaleString(), 'core'));
            }

            console.log(boxen(message.join('\n'), {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'red'
            }));
        }
    } catch (error) {
        // Error handled by API client
    }
}

module.exports = checkCommand;
