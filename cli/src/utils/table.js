/**
 * Table formatting utilities for Port Authority CLI
 */

const Table = require('cli-table3');
const chalk = require('chalk');
const { colors } = require('./colors');

/**
 * Create a styled table for port allocations
 */
function createAllocationTable(theme = 'management') {
    const themeColors = colors[theme];

    return new Table({
        head: [
            themeColors.primary.bold('Port'),
            themeColors.primary.bold('φ'),
            themeColors.primary.bold('Service'),
            themeColors.primary.bold('Project'),
            themeColors.primary.bold('Allocated At')
        ],
        style: {
            head: [],
            border: [themeColors.dim]
        },
        chars: {
            'top': '─',
            'top-mid': '┬',
            'top-left': '┌',
            'top-right': '┐',
            'bottom': '─',
            'bottom-mid': '┴',
            'bottom-left': '└',
            'bottom-right': '┘',
            'left': '│',
            'left-mid': '├',
            'mid': '─',
            'mid-mid': '┼',
            'right': '│',
            'right-mid': '┤',
            'middle': '│'
        }
    });
}

/**
 * Create a styled table for metrics
 */
function createMetricsTable(theme = 'management') {
    const themeColors = colors[theme];

    return new Table({
        head: [
            themeColors.primary.bold('Metric'),
            themeColors.primary.bold('Value')
        ],
        style: {
            head: [],
            border: [themeColors.dim]
        },
        colWidths: [30, 30],
        wordWrap: true
    });
}

/**
 * Create a styled table for statistics
 */
function createStatsTable(theme = 'utility') {
    const themeColors = colors[theme];

    return new Table({
        head: [
            themeColors.primary.bold('Category'),
            themeColors.primary.bold('Count'),
            themeColors.primary.bold('Percentage')
        ],
        style: {
            head: [],
            border: [themeColors.dim]
        }
    });
}

/**
 * Create a simple key-value table
 */
function createKeyValueTable(theme = 'core') {
    const themeColors = colors[theme];

    return new Table({
        style: {
            head: [],
            border: [themeColors.dim]
        },
        colWidths: [25, 55]
    });
}

/**
 * Format allocation data for table display
 */
function formatAllocationRow(allocation) {
    const phi = allocation.phiOptimized ? colors.status.phi : chalk.dim('-');
    const port = colors.core.accent(allocation.port.toString());
    const service = chalk.white(allocation.serviceName);
    const project = colors.text.dim(allocation.project);
    const date = colors.text.dim(new Date(allocation.allocatedAt).toLocaleString());

    return [port, phi, service, project, date];
}

module.exports = {
    createAllocationTable,
    createMetricsTable,
    createStatsTable,
    createKeyValueTable,
    formatAllocationRow
};
