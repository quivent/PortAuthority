/**
 * Domains command suite - Manage domain-to-service mappings
 */

const chalk = require('chalk');
const { Command } = require('commander');
const { colors, formatKeyValue } = require('../utils/colors');
const api = require('../utils/api');

const domainsProgram = new Command('domains');

domainsProgram
    .description('Manage domain-to-service mappings');

// List domains
domainsProgram
    .command('list')
    .alias('ls')
    .description('List all domain mappings')
    .option('-s, --service <name>', 'Filter by service name')
    .option('--ssl-only', 'Show only SSL-enabled domains')
    .action(async (options) => {
        try {
            let domains = await api.getDomains();

            if (options.service) {
                domains = domains.filter(d => d.serviceName === options.service);
            }

            if (options.sslOnly) {
                domains = domains.filter(d => d.ssl);
            }

            if (domains.length === 0) {
                console.log(chalk.yellow('No domains configured'));
                return;
            }

            console.log(chalk.bold(`\n🌐 Domain Mappings (${domains.length}):\n`));
            console.log(chalk.gray('─'.repeat(100)));

            // Header
            console.log(
                chalk.cyan('DOMAIN'.padEnd(30)),
                chalk.cyan('SERVICE'.padEnd(25)),
                chalk.cyan('SSL'.padEnd(8)),
                chalk.cyan('VERIFIED'.padEnd(12)),
                chalk.cyan('TYPE'.padEnd(12))
            );
            console.log(chalk.gray('─'.repeat(100)));

            // Domains
            domains.forEach(d => {
                const sslStatus = d.ssl ? chalk.green('✓ SSL') : chalk.gray('No SSL');
                const verifiedStatus = d.verified ? chalk.green('✓ Yes') : chalk.yellow('No');

                console.log(
                    chalk.white(d.domain.padEnd(30)),
                    chalk.cyan(d.serviceName.padEnd(25)),
                    sslStatus.padEnd(16),
                    verifiedStatus.padEnd(20),
                    chalk.dim(d.proxyType.padEnd(12))
                );
            });

            console.log(chalk.gray('─'.repeat(100)));
            console.log('');

        } catch (error) {
            // Error handled by API client
        }
    });

// Add domain
domainsProgram
    .command('add <domain> <service-name>')
    .description('Add a domain mapping')
    .option('--ssl', 'Enable SSL/HTTPS')
    .option('--cert <path>', 'SSL certificate path')
    .option('--key <path>', 'SSL key path')
    .option('--websocket', 'Enable WebSocket support')
    .action(async (domain, serviceName, options) => {
        try {
            console.log(chalk.yellow(`🌐 Adding domain mapping...`));

            const mapping = await api.addDomain(domain, serviceName, {
                ssl: options.ssl || false,
                certPath: options.cert,
                keyPath: options.key,
                proxyType: options.websocket ? 'websocket' : 'http'
            });

            console.log('');
            console.log(colors.status.success + ' ' + chalk.bold('Domain mapping added'));
            console.log('');
            console.log(formatKeyValue('Domain', mapping.domain, 'core'));
            console.log(formatKeyValue('Service', mapping.serviceName, 'core'));
            console.log(formatKeyValue('SSL', mapping.ssl ? 'Enabled' : 'Disabled', 'core'));
            console.log(formatKeyValue('Type', mapping.proxyType, 'core'));
            console.log('');

            if (mapping.ssl && (!mapping.certPath || !mapping.keyPath)) {
                console.log(chalk.yellow('⚠️  SSL enabled but certificates not configured'));
                console.log(chalk.gray('   Use --cert and --key options to specify certificate paths'));
                console.log('');
            }

        } catch (error) {
            // Error handled by API client
        }
    });

// Remove domain
domainsProgram
    .command('remove <domain>')
    .alias('rm')
    .description('Remove a domain mapping')
    .action(async (domain) => {
        try {
            console.log(chalk.yellow(`🗑️  Removing domain mapping...`));

            await api.removeDomain(domain);

            console.log('');
            console.log(colors.status.success + ' ' + chalk.bold(`Domain '${domain}' removed`));
            console.log('');

        } catch (error) {
            // Error handled by API client
        }
    });

// Show domain details
domainsProgram
    .command('show <domain>')
    .description('Show domain details')
    .action(async (domain) => {
        try {
            const mapping = await api.getDomain(domain);

            console.log('');
            console.log(chalk.bold.cyan(`🌐 ${mapping.domain}`));
            console.log(chalk.gray('─'.repeat(60)));
            console.log('');

            console.log(formatKeyValue('Service', mapping.serviceName, 'core'));
            console.log(formatKeyValue('SSL/HTTPS', mapping.ssl ? chalk.green('Enabled') : 'Disabled', 'core'));

            if (mapping.ssl) {
                console.log(formatKeyValue('Certificate', mapping.certPath || 'Not configured', 'core'));
                console.log(formatKeyValue('Private Key', mapping.keyPath || 'Not configured', 'core'));
            }

            console.log(formatKeyValue('Proxy Type', mapping.proxyType, 'core'));
            console.log(formatKeyValue('Verified', mapping.verified ? chalk.green('Yes') : chalk.yellow('No'), 'core'));
            console.log(formatKeyValue('Created', mapping.createdAt, 'core'));
            console.log('');

        } catch (error) {
            // Error handled by API client
        }
    });

// Verify domain
domainsProgram
    .command('verify <domain>')
    .description('Mark domain as verified')
    .action(async (domain) => {
        try {
            await api.verifyDomain(domain);

            console.log('');
            console.log(colors.status.success + ' ' + chalk.bold(`Domain '${domain}' verified`));
            console.log('');

        } catch (error) {
            // Error handled by API client
        }
    });

// Generate configs
domainsProgram
    .command('config')
    .description('Generate reverse proxy configuration')
    .option('-t, --type <type>', 'Config type (nginx, caddy)', 'nginx')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .action(async (options) => {
        try {
            const configType = options.type.toLowerCase();

            if (!['nginx', 'caddy'].includes(configType)) {
                console.error(chalk.red('❌ Invalid config type. Use: nginx or caddy'));
                process.exit(1);
            }

            console.log(chalk.yellow(`📝 Generating ${configType} configuration...`));
            console.log('');

            const config = await api.generateDomainConfig(configType);

            if (options.output) {
                const fs = require('fs');
                fs.writeFileSync(options.output, config, 'utf8');
                console.log(colors.status.success + ` Configuration saved to ${options.output}`);
            } else {
                console.log(chalk.gray('─'.repeat(80)));
                console.log(config);
                console.log(chalk.gray('─'.repeat(80)));
            }

            console.log('');

        } catch (error) {
            // Error handled by API client
        }
    });

module.exports = domainsProgram;
