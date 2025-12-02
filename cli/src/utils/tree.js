/**
 * Command tree visualization utilities
 */

const chalk = require('chalk');
const { colors, gradients } = require('./colors');

/**
 * Command metadata with categories
 */
const commandTree = {
    name: 'portauth',
    description: 'Port Authority CLI - Centralized port management',
    categories: [
        {
            name: 'Core Commands',
            emoji: '🔵',
            theme: 'core',
            commands: [
                {
                    name: 'allocate <service-name>',
                    description: 'Allocate a port for a service',
                    options: [
                        '-p, --preferred <port>',
                        '--priority <priority>',
                        '--project <project>'
                    ]
                },
                {
                    name: 'release <service-name>',
                    description: 'Release a port allocation',
                    options: []
                },
                {
                    name: 'check <port>',
                    description: 'Check if a port is available',
                    options: []
                }
            ]
        },
        {
            name: 'Management Commands',
            emoji: '🟢',
            theme: 'management',
            commands: [
                {
                    name: 'list',
                    description: 'List all port allocations',
                    options: ['-p, --project <project>']
                },
                {
                    name: 'metrics',
                    description: 'Show Port Authority metrics',
                    options: []
                },
                {
                    name: 'health',
                    description: 'Check Port Authority service health',
                    options: []
                }
            ]
        },
        {
            name: 'Utility Commands',
            emoji: '🟡',
            theme: 'utility',
            commands: [
                {
                    name: 'tree',
                    description: 'Show command hierarchy tree',
                    options: []
                },
                {
                    name: 'docs',
                    description: 'Show documentation',
                    options: [
                        '--web (open in browser)',
                        '--glow (render with glow)'
                    ]
                },
                {
                    name: 'stats',
                    description: 'Show detailed statistics',
                    options: ['-p, --project <project>']
                },
                {
                    name: 'scan',
                    description: 'Scan for port conflicts',
                    options: [
                        '--range <start-end>',
                        '--project <project>'
                    ]
                },
                {
                    name: 'watch',
                    description: 'Watch allocations in real-time',
                    options: [
                        '-i, --interval <seconds>',
                        '-p, --project <project>'
                    ]
                },
                {
                    name: 'export',
                    description: 'Export allocations to file',
                    options: [
                        '-f, --format <json|csv|yaml>',
                        '-o, --output <file>',
                        '-p, --project <project>'
                    ]
                }
            ]
        },
        {
            name: 'Administration',
            emoji: '🔴',
            theme: 'admin',
            commands: [
                {
                    name: 'enforce',
                    description: 'Kill unauthorized processes on allocated ports',
                    options: []
                }
            ]
        }
    ]
};

/**
 * Render the command tree with beautiful formatting
 */
function renderTree() {
    const output = [];

    // Header
    output.push('');
    output.push(gradients.rainbow('╔═══════════════════════════════════════════════════════════════════════════╗'));
    output.push(gradients.rainbow('║') + chalk.bold.white('                    PORT AUTHORITY COMMAND TREE                            ') + gradients.rainbow('║'));
    output.push(gradients.rainbow('╚═══════════════════════════════════════════════════════════════════════════╝'));
    output.push('');

    // Root
    output.push(chalk.bold.white(`${commandTree.name}`));
    output.push(chalk.gray(`  ${commandTree.description}`));
    output.push('');

    // Categories
    commandTree.categories.forEach((category, catIndex) => {
        const isLastCategory = catIndex === commandTree.categories.length - 1;
        const categoryPrefix = isLastCategory ? '└─' : '├─';
        const themeColors = colors[category.theme];

        // Category header
        output.push(chalk.gray(categoryPrefix) + ' ' + category.emoji + ' ' + themeColors.primary.bold(category.name));

        // Commands
        category.commands.forEach((cmd, cmdIndex) => {
            const isLastCommand = cmdIndex === category.commands.length - 1;
            const categoryIndent = isLastCategory ? '  ' : '│ ';
            const commandPrefix = isLastCommand ? '└─' : '├─';

            // Command name
            output.push(
                chalk.gray(categoryIndent + '  ' + commandPrefix + ' ') +
                themeColors.secondary.bold(cmd.name)
            );

            // Description
            output.push(
                chalk.gray(categoryIndent + '  ' + (isLastCommand ? ' ' : '│') + '   ') +
                chalk.white(cmd.description)
            );

            // Options
            if (cmd.options && cmd.options.length > 0) {
                cmd.options.forEach((opt, optIndex) => {
                    const isLastOption = optIndex === cmd.options.length - 1;
                    const optionIndent = isLastCommand ? ' ' : '│';
                    output.push(
                        chalk.gray(categoryIndent + '  ' + optionIndent + '   ' + (isLastOption ? '└─' : '├─') + ' ') +
                        (themeColors.accent ? themeColors.accent(opt) : chalk.cyan(opt))
                    );
                });
            }

            // Add spacing between commands
            if (!isLastCommand) {
                output.push(chalk.gray(categoryIndent + '  │'));
            }
        });

        // Add spacing between categories
        if (!isLastCategory) {
            output.push(chalk.gray('│'));
        }
    });

    output.push('');
    output.push(chalk.gray('─'.repeat(80)));
    output.push(chalk.gray('Run ') + chalk.cyan.bold('portauth <command> --help') + chalk.gray(' for detailed command information'));
    output.push('');

    return output.join('\n');
}

/**
 * Get commands by category
 */
function getCommandsByCategory(categoryName) {
    const category = commandTree.categories.find(c => c.name === categoryName);
    return category ? category.commands : [];
}

/**
 * Get all command names
 */
function getAllCommandNames() {
    return commandTree.categories.flatMap(cat =>
        cat.commands.map(cmd => cmd.name.split(' ')[0])
    );
}

module.exports = {
    commandTree,
    renderTree,
    getCommandsByCategory,
    getAllCommandNames
};
