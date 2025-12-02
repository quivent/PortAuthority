/**
 * Health command - Check Port Authority service health
 */

const chalk = require('chalk');
const boxen = require('boxen');
const { colors, formatKeyValue } = require('../utils/colors');
const api = require('../utils/api');

async function healthCommand() {
    try {
        const health = await api.getHealth();

        const uptimeSeconds = Math.floor(health.uptime);
        const uptimeMinutes = Math.floor(uptimeSeconds / 60);
        const uptimeHours = Math.floor(uptimeMinutes / 60);
        const uptimeDays = Math.floor(uptimeHours / 24);

        let uptimeDisplay;
        if (uptimeDays > 0) {
            uptimeDisplay = `${uptimeDays}d ${uptimeHours % 24}h ${uptimeMinutes % 60}m`;
        } else if (uptimeHours > 0) {
            uptimeDisplay = `${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`;
        } else if (uptimeMinutes > 0) {
            uptimeDisplay = `${uptimeMinutes}m ${uptimeSeconds % 60}s`;
        } else {
            uptimeDisplay = `${uptimeSeconds}s`;
        }

        const message = [
            colors.status.success + ' ' + chalk.bold.green('Port Authority is healthy'),
            '',
            formatKeyValue('Status', chalk.green.bold('ONLINE'), 'management'),
            formatKeyValue('Uptime', uptimeDisplay, 'management'),
            formatKeyValue('Allocations', health.allocations, 'management'),
            '',
            chalk.gray('All systems operational')
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

module.exports = healthCommand;
