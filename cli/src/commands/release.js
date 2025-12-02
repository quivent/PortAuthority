/**
 * Release command - Release a port allocation
 */

const chalk = require('chalk');
const { colors } = require('../utils/colors');
const api = require('../utils/api');

async function releaseCommand(serviceName) {
    try {
        await api.release(serviceName);
        console.log('');
        console.log(colors.status.success + ' ' + chalk.bold.white(`Port released for ${chalk.cyan(serviceName)}`));
        console.log('');
    } catch (error) {
        // Error handled by API client
    }
}

module.exports = releaseCommand;
