/**
 * Enforce command - Enforce port authority by killing unauthorized processes
 */

const chalk = require('chalk');
const boxen = require('boxen');
const ora = require('ora');
const { colors } = require('../utils/colors');
const api = require('../utils/api');

async function enforceCommand() {
    const spinner = ora({
        text: 'Enforcing port authority...',
        color: 'red'
    }).start();

    try {
        const { violations, killed } = await api.enforce();

        spinner.stop();

        if (killed === 0) {
            const message = [
                colors.status.success + ' ' + chalk.green.bold('No violations detected'),
                '',
                chalk.white('All ports are properly authorized'),
                '',
                chalk.gray('System is in compliance')
            ].join('\n');

            console.log(boxen(message, {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'green'
            }));
        } else {
            const message = [
                colors.status.warning + ' ' + chalk.red.bold(`Killed ${killed} unauthorized process${killed !== 1 ? 'es' : ''}`),
                '',
                chalk.white('Violations:')
            ];

            violations.forEach(v => {
                message.push(chalk.gray(`  Port ${chalk.red(v.port)}: PID ${v.pid}`));
            });

            message.push('');
            message.push(chalk.gray('Port authority has been enforced'));

            console.log(boxen(message.join('\n'), {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'red'
            }));
        }

    } catch (error) {
        spinner.fail('Enforcement failed');
        throw error;
    }
}

module.exports = enforceCommand;
