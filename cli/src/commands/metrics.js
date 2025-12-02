/**
 * Metrics command - Show Port Authority metrics
 */

const chalk = require('chalk');
const boxen = require('boxen');
const { colors, createHeader, gradients } = require('../utils/colors');
const { createMetricsTable } = require('../utils/table');
const api = require('../utils/api');

async function metricsCommand() {
    try {
        const metrics = await api.getMetrics();

        // Main metrics table
        const mainTable = createMetricsTable('management');
        mainTable.push(
            [colors.management.accent('Total Allocations'), chalk.white(metrics.totalAllocations)],
            [colors.management.accent('Active Allocations'), chalk.white(metrics.activeAllocations)],
            [colors.management.accent('φ-Optimized Ports'), chalk.yellow(metrics.phiOptimized)],
            [colors.management.accent('Port Range'), chalk.white(`${metrics.portRange.start} - ${metrics.portRange.end}`)]
        );

        // Project breakdown table
        const projectTable = createMetricsTable('management');
        Object.entries(metrics.byProject).forEach(([project, count]) => {
            const percentage = Math.round((count / metrics.totalAllocations) * 100);
            const bar = '█'.repeat(Math.floor(percentage / 5));
            projectTable.push([
                colors.management.accent(project),
                chalk.white(`${count} `) + chalk.gray(`(${percentage}%) `) + chalk.cyan(bar)
            ]);
        });

        // Display
        console.log(createHeader('📊 Port Authority Metrics'));
        console.log(mainTable.toString());
        console.log('');
        console.log(chalk.bold.white('📈 Allocations by Project:'));
        console.log(projectTable.toString());
        console.log('');

        // Calculate efficiency
        const efficiency = metrics.phiOptimized / metrics.totalAllocations;
        const efficiencyPercent = Math.round(efficiency * 100);
        let efficiencyColor = chalk.red;
        let efficiencyLabel = 'Low';

        if (efficiencyPercent >= 70) {
            efficiencyColor = chalk.green;
            efficiencyLabel = 'Excellent';
        } else if (efficiencyPercent >= 50) {
            efficiencyColor = chalk.yellow;
            efficiencyLabel = 'Good';
        } else if (efficiencyPercent >= 30) {
            efficiencyColor = chalk.hex('#FFA500'); // orange
            efficiencyLabel = 'Fair';
        }

        const efficiencyMessage = [
            chalk.bold.white('φ Optimization Efficiency:'),
            '',
            efficiencyColor.bold(`${efficiencyPercent}% - ${efficiencyLabel}`),
            '',
            chalk.gray('Golden ratio optimization improves port allocation efficiency')
        ].join('\n');

        console.log(boxen(efficiencyMessage, {
            padding: 1,
            borderStyle: 'round',
            borderColor: 'yellow'
        }));
        console.log('');

    } catch (error) {
        // Error handled by API client
    }
}

module.exports = metricsCommand;
