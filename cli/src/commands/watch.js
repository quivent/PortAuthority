/**
 * Watch command - Watch allocations in real-time
 */

const chalk = require('chalk');
const { colors, createHeader } = require('../utils/colors');
const { createAllocationTable, formatAllocationRow } = require('../utils/table');
const api = require('../utils/api');

let watchInterval = null;
let previousAllocations = [];

async function watchCommand(options) {
    const interval = (options.interval || 5) * 1000; // Convert to milliseconds

    console.log(createHeader('👀 Watching Port Allocations'));
    console.log(chalk.gray(`Refresh interval: ${options.interval || 5} seconds`));
    console.log(chalk.gray('Press Ctrl+C to stop'));
    console.log('');

    // Initial display
    await displayAllocations(options.project);

    // Set up interval
    watchInterval = setInterval(async () => {
        await displayAllocations(options.project);
    }, interval);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
        if (watchInterval) {
            clearInterval(watchInterval);
        }
        console.log('');
        console.log(chalk.yellow('👋 Stopped watching'));
        console.log('');
        process.exit(0);
    });
}

async function displayAllocations(project) {
    try {
        const allocations = await api.getAllocations(project);

        // Clear screen and move cursor to top
        process.stdout.write('\x1B[2J\x1B[0f');

        // Header
        console.log(createHeader('👀 Port Allocations (Live)'));
        console.log(chalk.gray(`Last updated: ${new Date().toLocaleTimeString()}`));
        console.log('');

        if (allocations.length === 0) {
            console.log(colors.status.warning + ' ' + chalk.yellow('No allocations found'));
            return;
        }

        // Create table
        const table = createAllocationTable('utility');

        // Add rows with change indicators
        allocations.forEach(allocation => {
            const row = formatAllocationRow(allocation);

            // Check if this is a new allocation
            const isNew = !previousAllocations.find(a => a.serviceName === allocation.serviceName);
            if (isNew) {
                row[0] = colors.status.success + ' ' + row[0]; // Add indicator to port
            }

            table.push(row);
        });

        // Check for removed allocations
        const removed = previousAllocations.filter(
            prev => !allocations.find(curr => curr.serviceName === prev.serviceName)
        );

        console.log(table.toString());
        console.log('');

        // Summary
        console.log(chalk.gray(`Total: ${allocations.length} allocation${allocations.length !== 1 ? 's' : ''}`));

        const phiCount = allocations.filter(a => a.phiOptimized).length;
        if (phiCount > 0) {
            console.log(chalk.gray(`φ-Optimized: ${phiCount} (${Math.round(phiCount / allocations.length * 100)}%)`));
        }

        // Show changes
        if (removed.length > 0) {
            console.log('');
            console.log(colors.status.error + ' ' + chalk.red(`Removed: ${removed.map(a => a.serviceName).join(', ')}`));
        }

        console.log('');
        console.log(chalk.gray('─'.repeat(80)));
        console.log(chalk.gray('Press Ctrl+C to stop watching'));

        // Update previous allocations
        previousAllocations = allocations;

    } catch (error) {
        console.error(colors.status.error + ' ' + chalk.red('Failed to fetch allocations'));
        console.log(chalk.gray('Retrying...'));
    }
}

module.exports = watchCommand;
