#!/usr/bin/env node

/**
 * Port Authority CLI - Command-line interface for port management
 */

const { Command } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

const PORT_AUTHORITY_URL = process.env.PORT_AUTHORITY_URL || 'http://localhost:9999';

const program = new Command();

program
    .name('portauth')
    .description('Port Authority CLI - Centralized port management')
    .version('1.0.0');

// Allocate command
program
    .command('allocate <service-name>')
    .description('Allocate a port for a service')
    .option('-p, --preferred <port>', 'Preferred port number')
    .option('--priority <priority>', 'Allocation priority (1-5)', '1')
    .option('--project <project>', 'Project name', 'default')
    .action(async (serviceName, options) => {
        try {
            const response = await axios.post(`${PORT_AUTHORITY_URL}/allocate`, {
                serviceName,
                preferredPort: options.preferred ? parseInt(options.preferred) : undefined,
                priority: parseInt(options.priority),
                project: options.project
            });

            const allocation = response.data;
            console.log(chalk.green('✅ Port allocated successfully!'));
            console.log('');
            console.log(chalk.cyan('Service:'), allocation.serviceName);
            console.log(chalk.cyan('Port:'), chalk.bold(allocation.port));
            console.log(chalk.cyan('Project:'), allocation.project);
            console.log(chalk.cyan('φ-Optimized:'), allocation.phiOptimized ? '✓' : '✗');
            console.log('');
            console.log(chalk.yellow('Use this port in your service:'));
            console.log(chalk.gray(`  export PORT=${allocation.port}`));
            console.log(chalk.gray(`  const port = ${allocation.port};`));
        } catch (error) {
            console.error(chalk.red('❌ Failed to allocate port:'), error.response?.data?.error || error.message);
            process.exit(1);
        }
    });

// Release command
program
    .command('release <service-name>')
    .description('Release a port allocation')
    .action(async (serviceName) => {
        try {
            await axios.post(`${PORT_AUTHORITY_URL}/release`, { serviceName });
            console.log(chalk.green(`✅ Port released for ${serviceName}`));
        } catch (error) {
            console.error(chalk.red('❌ Failed to release port:'), error.response?.data?.error || error.message);
            process.exit(1);
        }
    });

// List command
program
    .command('list')
    .description('List all port allocations')
    .option('-p, --project <project>', 'Filter by project')
    .action(async (options) => {
        try {
            const response = await axios.get(`${PORT_AUTHORITY_URL}/allocations`);
            let allocations = response.data;

            if (options.project) {
                allocations = allocations.filter(a => a.project === options.project);
            }

            if (allocations.length === 0) {
                console.log(chalk.yellow('No allocations found'));
                return;
            }

            console.log(chalk.bold('\n📋 Port Allocations:\n'));
            console.log(chalk.gray('─'.repeat(80)));

            allocations.forEach(alloc => {
                const phi = alloc.phiOptimized ? chalk.yellow('φ') : ' ';
                console.log(
                    chalk.cyan(alloc.port.toString().padEnd(6)),
                    phi,
                    chalk.white(alloc.serviceName.padEnd(30)),
                    chalk.gray(alloc.project.padEnd(15)),
                    chalk.dim(alloc.allocatedAt)
                );
            });

            console.log(chalk.gray('─'.repeat(80)));
            console.log(chalk.gray(`\nTotal: ${allocations.length} allocations`));
        } catch (error) {
            console.error(chalk.red('❌ Failed to list allocations:'), error.message);
            process.exit(1);
        }
    });

// Check command
program
    .command('check <port>')
    .description('Check if a port is available')
    .action(async (port) => {
        try {
            const response = await axios.get(`${PORT_AUTHORITY_URL}/check/${port}`);
            const { available } = response.data;

            if (available) {
                console.log(chalk.green(`✅ Port ${port} is available`));
            } else {
                console.log(chalk.red(`❌ Port ${port} is already allocated`));

                // Get who is using it
                const allocResponse = await axios.get(`${PORT_AUTHORITY_URL}/allocations`);
                const allocation = allocResponse.data.find(a => a.port === parseInt(port));
                if (allocation) {
                    console.log(chalk.yellow(`   Allocated to: ${allocation.serviceName} (${allocation.project})`));
                }
            }
        } catch (error) {
            console.error(chalk.red('❌ Error checking port:'), error.message);
            process.exit(1);
        }
    });

// Enforce command
program
    .command('enforce')
    .description('Enforce port authority - kill unauthorized processes')
    .action(async () => {
        try {
            console.log(chalk.yellow('⚡ Enforcing port authority...'));
            const response = await axios.post(`${PORT_AUTHORITY_URL}/enforce`);
            const { violations, killed } = response.data;

            if (killed === 0) {
                console.log(chalk.green('✅ No violations detected - all ports authorized'));
            } else {
                console.log(chalk.red(`⚠️  Killed ${killed} unauthorized process(es)`));
                violations.forEach(v => {
                    console.log(chalk.gray(`   Port ${v.port}: PID ${v.pid}`));
                });
            }
        } catch (error) {
            console.error(chalk.red('❌ Enforcement failed:'), error.message);
            process.exit(1);
        }
    });

// Metrics command
program
    .command('metrics')
    .description('Show Port Authority metrics')
    .action(async () => {
        try {
            const response = await axios.get(`${PORT_AUTHORITY_URL}/metrics`);
            const metrics = response.data;

            console.log(chalk.bold('\n📊 Port Authority Metrics:\n'));
            console.log(chalk.cyan('Total Allocations:'), metrics.totalAllocations);
            console.log(chalk.cyan('Active Allocations:'), metrics.activeAllocations);
            console.log(chalk.cyan('φ-Optimized:'), metrics.phiOptimized);
            console.log(chalk.cyan('Port Range:'), `${metrics.portRange.start} - ${metrics.portRange.end}`);
            console.log('');
            console.log(chalk.bold('By Project:'));
            Object.entries(metrics.byProject).forEach(([project, count]) => {
                console.log(chalk.gray(`  ${project}:`), count);
            });
        } catch (error) {
            console.error(chalk.red('❌ Failed to get metrics:'), error.message);
            process.exit(1);
        }
    });

// Health command
program
    .command('health')
    .description('Check Port Authority service health')
    .action(async () => {
        try {
            const response = await axios.get(`${PORT_AUTHORITY_URL}/health`);
            const health = response.data;

            console.log(chalk.green('✅ Port Authority is healthy'));
            console.log(chalk.cyan('Uptime:'), `${Math.floor(health.uptime)}s`);
            console.log(chalk.cyan('Allocations:'), health.allocations);
        } catch (error) {
            console.error(chalk.red('❌ Port Authority is not responding'));
            console.error(chalk.gray(`   Make sure the service is running: npm start`));
            process.exit(1);
        }
    });

program.parse();
