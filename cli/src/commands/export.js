/**
 * Export command - Export allocations to file
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { colors } = require('../utils/colors');
const api = require('../utils/api');

async function exportCommand(options) {
    try {
        const allocations = await api.getAllocations(options.project);

        if (allocations.length === 0) {
            console.log('');
            console.log(colors.status.warning + ' ' + chalk.yellow.bold('No allocations to export'));
            console.log('');
            return;
        }

        const format = options.format || 'json';
        const outputFile = options.output || `port-allocations.${format}`;

        let content;
        switch (format.toLowerCase()) {
            case 'json':
                content = JSON.stringify(allocations, null, 2);
                break;

            case 'csv':
                content = generateCSV(allocations);
                break;

            case 'yaml':
                content = generateYAML(allocations);
                break;

            default:
                console.error(colors.status.error + ' ' + chalk.red(`Unsupported format: ${format}`));
                console.log(chalk.gray('   Supported formats: json, csv, yaml'));
                process.exit(1);
        }

        // Write file
        fs.writeFileSync(outputFile, content);

        console.log('');
        console.log(colors.status.success + ' ' + chalk.green.bold('Allocations exported successfully!'));
        console.log('');
        console.log(colors.utility.accent('Format:'), chalk.white(format.toUpperCase()));
        console.log(colors.utility.accent('Records:'), chalk.white(allocations.length));
        console.log(colors.utility.accent('File:'), chalk.cyan(path.resolve(outputFile)));
        console.log('');

    } catch (error) {
        console.error(colors.status.error + ' ' + chalk.red('Export failed:'), error.message);
        process.exit(1);
    }
}

function generateCSV(allocations) {
    const headers = ['Port', 'Service', 'Project', 'Priority', 'φ-Optimized', 'Allocated At'];
    const rows = allocations.map(a => [
        a.port,
        a.serviceName,
        a.project,
        a.priority || 1,
        a.phiOptimized ? 'Yes' : 'No',
        a.allocatedAt
    ]);

    return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
}

function generateYAML(allocations) {
    const lines = ['allocations:'];

    allocations.forEach(a => {
        lines.push(`  - port: ${a.port}`);
        lines.push(`    service: ${a.serviceName}`);
        lines.push(`    project: ${a.project}`);
        lines.push(`    priority: ${a.priority || 1}`);
        lines.push(`    phiOptimized: ${a.phiOptimized}`);
        lines.push(`    allocatedAt: ${a.allocatedAt}`);
    });

    return lines.join('\n');
}

module.exports = exportCommand;
