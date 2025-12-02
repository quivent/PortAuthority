/**
 * Allocate command - Allocate a port for a service
 */

const chalk = require('chalk');
const boxen = require('boxen');
const { colors, formatKeyValue } = require('../utils/colors');
const api = require('../utils/api');

async function allocateCommand(serviceName, options) {
    try {
        const allocation = await api.allocate(serviceName, options);

        // Create success message box
        const message = [
            colors.status.success + ' ' + chalk.bold.white('Port Allocated Successfully!'),
            '',
            formatKeyValue('Service', allocation.serviceName, 'core'),
            formatKeyValue('Port', chalk.bold(allocation.port), 'core'),
            formatKeyValue('Project', allocation.project, 'core'),
            formatKeyValue('φ-Optimized', allocation.phiOptimized ? '✓ Yes' : '✗ No', 'core'),
            '',
            chalk.yellow.bold('🔧 Use this port in your service:'),
            '',
            chalk.gray('  # Environment variable:'),
            chalk.cyan(`  export PORT=${allocation.port}`),
            '',
            chalk.gray('  # In your code:'),
            chalk.cyan(`  const port = ${allocation.port};`),
            ''
        ].join('\n');

        console.log(boxen(message, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'blue'
        }));

    } catch (error) {
        // Error handled by API client
    }
}

module.exports = allocateCommand;
