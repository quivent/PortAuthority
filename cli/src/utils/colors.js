/**
 * Color scheme and styling utilities for Port Authority CLI
 */

const chalk = require('chalk');
const gradient = require('gradient-string');

// Color groups for different command categories
const colors = {
    // Core commands (blue theme)
    core: {
        primary: chalk.blue,
        secondary: chalk.blueBright,
        accent: chalk.cyan,
        dim: chalk.blue.dim
    },

    // Management commands (green theme)
    management: {
        primary: chalk.green,
        secondary: chalk.greenBright,
        accent: chalk.lime,
        dim: chalk.green.dim
    },

    // Utility commands (yellow/orange theme)
    utility: {
        primary: chalk.yellow,
        secondary: chalk.yellowBright,
        accent: chalk.hex('#FFA500'), // orange
        dim: chalk.yellow.dim
    },

    // Administration commands (red theme)
    admin: {
        primary: chalk.red,
        secondary: chalk.redBright,
        accent: chalk.magenta,
        dim: chalk.red.dim
    },

    // Status indicators
    status: {
        success: chalk.green('✅'),
        error: chalk.red('❌'),
        warning: chalk.yellow('⚠️'),
        info: chalk.blue('ℹ️'),
        phi: chalk.yellow('φ')
    },

    // General purpose
    text: {
        normal: chalk.white,
        dim: chalk.gray,
        bold: chalk.bold,
        italic: chalk.italic
    }
};

// Gradients for special displays
const gradients = {
    rainbow: gradient('red', 'orange', 'yellow', 'green', 'blue', 'purple'),
    ocean: gradient('blue', 'cyan', 'teal'),
    fire: gradient('red', 'orange', 'yellow'),
    sunset: gradient('purple', 'pink', 'orange'),
    forest: gradient('green', 'lime', 'cyan')
};

// Create a themed box title
function createTitle(text, theme = 'core') {
    const themeColors = colors[theme];
    return themeColors.primary.bold(text);
}

// Create a section header
function createHeader(text, emoji = '') {
    return `\n${emoji ? emoji + ' ' : ''}${chalk.bold.white(text)}\n`;
}

// Create a separator line
function createSeparator(char = '─', length = 80, color = 'gray') {
    return chalk[color](char.repeat(length));
}

// Format a key-value pair with color
function formatKeyValue(key, value, theme = 'core') {
    const themeColors = colors[theme];
    return `${themeColors.accent(key + ':')} ${chalk.white(value)}`;
}

module.exports = {
    colors,
    gradients,
    createTitle,
    createHeader,
    createSeparator,
    formatKeyValue
};
