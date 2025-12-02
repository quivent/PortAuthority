/**
 * Auto-launch command - Smart launcher that detects project type
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const boxen = require('boxen');
const { colors, formatKeyValue } = require('../utils/colors');
const api = require('../utils/api');

async function autoLaunchCommand(options) {
    try {
        const cwd = process.cwd();
        const dirName = path.basename(cwd);

        console.log(chalk.yellow('🔍 Auto-detecting project type...'));
        console.log(chalk.gray(`   Directory: ${cwd}`));
        console.log('');

        // Detect project type and command
        const detection = detectProjectType(cwd);

        if (!detection) {
            console.error(chalk.red('❌ Could not auto-detect project type'));
            console.error('');
            console.error(chalk.yellow('Supported project types:'));
            console.error(chalk.gray('  - Node.js (package.json)'));
            console.error(chalk.gray('  - Makefile projects (Makefile)'));
            console.error(chalk.gray('  - Go (go.mod)'));
            console.error(chalk.gray('  - Python (requirements.txt, setup.py)'));
            console.error(chalk.gray('  - Rust (Cargo.toml)'));
            console.error('');
            console.error(chalk.cyan('💡 Use explicit launch instead:'));
            console.error(chalk.gray('   portauth launch my-service --command "your-command"'));
            process.exit(1);
        }

        console.log(chalk.green('✓ Detected:'), chalk.bold(detection.type));
        console.log(chalk.green('✓ Command:'), chalk.cyan(detection.command));
        console.log('');

        // Use directory name as default service name
        const serviceName = options.name || dirName;

        // Check if service is already allocated
        let allocation;
        try {
            allocation = await api.getAllocations();
            allocation = allocation.find(a => a.serviceName === serviceName);
        } catch (error) {
            // Service probably not allocated yet
        }

        // Allocate port if not already allocated
        if (!allocation) {
            console.log(chalk.yellow(`📍 Allocating port for '${serviceName}'...`));
            allocation = await api.allocate(serviceName, {
                project: options.project || 'auto',
                priority: 1
            });
            console.log(chalk.green(`✓ Allocated port ${allocation.port}`));
            console.log('');
        } else {
            console.log(chalk.blue(`ℹ️  Using existing allocation (port ${allocation.port})`));
            console.log('');
        }

        // Launch the service
        console.log(chalk.yellow('🚀 Launching service...'));

        const result = await api.launch(serviceName, {
            command: detection.command,
            cwd: cwd,
            env: detection.env || {},
            autoRestart: options.autoRestart || false,
            captureOutput: true
        });

        // Create success message box
        const message = [
            colors.status.success + ' ' + chalk.bold.white('Auto-Launch Successful!'),
            '',
            formatKeyValue('Service', result.serviceName, 'core'),
            formatKeyValue('Type', detection.type, 'core'),
            formatKeyValue('Port', chalk.bold(result.port), 'core'),
            formatKeyValue('PID', result.pid, 'core'),
            '',
            chalk.gray('Command:'),
            chalk.cyan(`  ${detection.command}`),
            '',
            chalk.yellow.bold('📋 Next steps:'),
            chalk.cyan(`  portauth ps ${serviceName}`),
            chalk.cyan(`  portauth logs ${serviceName} --follow`)
        ].join('\n');

        console.log(boxen(message, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green'
        }));

    } catch (error) {
        // Error handled by API client
    }
}

/**
 * Detect project type and return appropriate launch command
 */
function detectProjectType(cwd) {
    // Check for package.json (Node.js)
    if (fs.existsSync(path.join(cwd, 'package.json'))) {
        const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));

        // Check for common start scripts
        if (pkg.scripts) {
            if (pkg.scripts.dev) {
                return {
                    type: 'Node.js (dev)',
                    command: 'npm run dev',
                    env: { NODE_ENV: 'development' }
                };
            }
            if (pkg.scripts.start) {
                return {
                    type: 'Node.js (start)',
                    command: 'npm start'
                };
            }
        }

        return {
            type: 'Node.js',
            command: 'node index.js'
        };
    }

    // Check for Makefile
    if (fs.existsSync(path.join(cwd, 'Makefile')) || fs.existsSync(path.join(cwd, 'makefile'))) {
        return {
            type: 'Makefile project',
            command: 'make run'
        };
    }

    // Check for Go
    if (fs.existsSync(path.join(cwd, 'go.mod'))) {
        // Check for main.go
        if (fs.existsSync(path.join(cwd, 'main.go'))) {
            return {
                type: 'Go',
                command: 'go run main.go'
            };
        }
        // Check for cmd/server or cmd/main
        if (fs.existsSync(path.join(cwd, 'cmd', 'server'))) {
            return {
                type: 'Go',
                command: 'go run ./cmd/server'
            };
        }
        if (fs.existsSync(path.join(cwd, 'cmd', 'main'))) {
            return {
                type: 'Go',
                command: 'go run ./cmd/main'
            };
        }
        return {
            type: 'Go',
            command: 'go run .'
        };
    }

    // Check for Rust
    if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) {
        return {
            type: 'Rust',
            command: 'cargo run'
        };
    }

    // Check for Python
    if (fs.existsSync(path.join(cwd, 'requirements.txt')) ||
        fs.existsSync(path.join(cwd, 'setup.py')) ||
        fs.existsSync(path.join(cwd, 'pyproject.toml'))) {

        // Check for common Python server files
        if (fs.existsSync(path.join(cwd, 'app.py'))) {
            return {
                type: 'Python (Flask/FastAPI)',
                command: 'python3 app.py',
                env: { FLASK_APP: 'app.py' }
            };
        }
        if (fs.existsSync(path.join(cwd, 'main.py'))) {
            return {
                type: 'Python',
                command: 'python3 main.py'
            };
        }
        if (fs.existsSync(path.join(cwd, 'manage.py'))) {
            return {
                type: 'Python (Django)',
                command: 'python3 manage.py runserver'
            };
        }

        return {
            type: 'Python',
            command: 'python3 server.py'
        };
    }

    // Check for Deno
    if (fs.existsSync(path.join(cwd, 'deno.json')) || fs.existsSync(path.join(cwd, 'deno.jsonc'))) {
        return {
            type: 'Deno',
            command: 'deno run --allow-net main.ts'
        };
    }

    // Check for Bun
    if (fs.existsSync(path.join(cwd, 'bun.lockb'))) {
        return {
            type: 'Bun',
            command: 'bun run index.ts'
        };
    }

    // Check for Docker
    if (fs.existsSync(path.join(cwd, 'docker-compose.yml'))) {
        return {
            type: 'Docker Compose',
            command: 'docker-compose up'
        };
    }

    return null;
}

module.exports = autoLaunchCommand;
