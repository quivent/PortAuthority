/**
 * Stats command - Show detailed statistics
 */

const chalk = require('chalk');
const { colors, createHeader } = require('../utils/colors');
const { createStatsTable, createMetricsTable } = require('../utils/table');
const api = require('../utils/api');

async function statsCommand(options) {
    try {
        const allocations = await api.getAllocations(options.project);
        const metrics = await api.getMetrics();

        if (allocations.length === 0) {
            console.log('');
            console.log(colors.status.warning + ' ' + chalk.yellow.bold('No allocations found'));
            console.log('');
            return;
        }

        console.log(createHeader('📊 Detailed Statistics'));

        // Overview stats
        const overviewTable = createMetricsTable('utility');
        overviewTable.push(
            [colors.utility.accent('Total Allocations'), chalk.white(allocations.length)],
            [colors.utility.accent('φ-Optimized'), chalk.yellow(`${allocations.filter(a => a.phiOptimized).length} (${Math.round(allocations.filter(a => a.phiOptimized).length / allocations.length * 100)}%)`)],
            [colors.utility.accent('Port Range Used'), chalk.white(`${Math.min(...allocations.map(a => a.port))} - ${Math.max(...allocations.map(a => a.port))}`)],
            [colors.utility.accent('Average Port'), chalk.white(Math.round(allocations.reduce((sum, a) => sum + a.port, 0) / allocations.length))]
        );

        console.log(overviewTable.toString());
        console.log('');

        // By project breakdown
        console.log(chalk.bold.white('📁 By Project:'));
        const projectStats = {};
        allocations.forEach(a => {
            if (!projectStats[a.project]) {
                projectStats[a.project] = { count: 0, phiOptimized: 0 };
            }
            projectStats[a.project].count++;
            if (a.phiOptimized) projectStats[a.project].phiOptimized++;
        });

        const projectTable = createStatsTable('utility');
        Object.entries(projectStats).forEach(([project, stats]) => {
            const percentage = Math.round((stats.count / allocations.length) * 100);
            const phiPercent = Math.round((stats.phiOptimized / stats.count) * 100);
            projectTable.push([
                colors.utility.accent(project),
                chalk.white(stats.count),
                chalk.white(`${percentage}% `) + chalk.gray(`(φ: ${phiPercent}%)`)
            ]);
        });

        console.log(projectTable.toString());
        console.log('');

        // Port distribution
        console.log(chalk.bold.white('🔢 Port Distribution:'));
        const ranges = [
            { name: '1000-2999', min: 1000, max: 2999 },
            { name: '3000-4999', min: 3000, max: 4999 },
            { name: '5000-6999', min: 5000, max: 6999 },
            { name: '7000-8999', min: 7000, max: 8999 },
            { name: '9000+', min: 9000, max: 65535 }
        ];

        const rangeTable = createStatsTable('utility');
        ranges.forEach(range => {
            const count = allocations.filter(a => a.port >= range.min && a.port <= range.max).length;
            const percentage = Math.round((count / allocations.length) * 100);
            const bar = '█'.repeat(Math.floor(percentage / 2));
            rangeTable.push([
                colors.utility.accent(range.name),
                chalk.white(count),
                chalk.white(`${percentage}% `) + chalk.cyan(bar)
            ]);
        });

        console.log(rangeTable.toString());
        console.log('');

        // Recent allocations
        console.log(chalk.bold.white('🕒 Recent Activity:'));
        const recentAllocations = [...allocations]
            .sort((a, b) => new Date(b.allocatedAt) - new Date(a.allocatedAt))
            .slice(0, 5);

        recentAllocations.forEach((a, i) => {
            const phi = a.phiOptimized ? colors.status.phi : chalk.dim('-');
            const time = new Date(a.allocatedAt).toLocaleString();
            console.log(
                chalk.gray(`  ${i + 1}. `) +
                chalk.cyan(a.port) + ' ' +
                phi + ' ' +
                chalk.white(a.serviceName) + ' ' +
                chalk.gray(`(${a.project}) - ${time}`)
            );
        });

        console.log('');

    } catch (error) {
        // Error handled by API client
    }
}

module.exports = statsCommand;
