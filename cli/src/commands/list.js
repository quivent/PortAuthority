/**
 * List command - List all port allocations
 */

const chalk = require('chalk');
const { colors, createHeader, createSeparator } = require('../utils/colors');
const { createAllocationTable, formatAllocationRow } = require('../utils/table');
const api = require('../utils/api');

async function listCommand(options) {
    try {
        const allocations = await api.getAllocations(options.project);

        if (allocations.length === 0) {
            console.log('');
            console.log(colors.status.warning + ' ' + chalk.yellow.bold('No allocations found'));
            if (options.project) {
                console.log(chalk.gray(`   No allocations for project: ${options.project}`));
            }
            console.log('');
            return;
        }

        // Create table
        const table = createAllocationTable('management');

        // Add rows
        allocations.forEach(allocation => {
            table.push(formatAllocationRow(allocation));
        });

        // Display
        console.log(createHeader('📋 Port Allocations', ''));
        console.log(table.toString());
        console.log('');
        console.log(chalk.gray(`Total: ${allocations.length} allocation${allocations.length !== 1 ? 's' : ''}`));

        // Show φ-optimized count
        const phiCount = allocations.filter(a => a.phiOptimized).length;
        if (phiCount > 0) {
            console.log(chalk.gray(`φ-Optimized: ${phiCount} (${Math.round(phiCount / allocations.length * 100)}%)`));
        }
        console.log('');

    } catch (error) {
        // Error handled by API client
    }
}

module.exports = listCommand;
