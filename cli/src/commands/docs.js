/**
 * Docs command - Show documentation
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const open = require('open');
const { spawn } = require('child_process');
const { colors } = require('../utils/colors');

async function docsCommand(options) {
    const docsPath = path.join(__dirname, '../../..', 'docs');
    const usageFile = path.join(docsPath, 'USAGE.md');
    const installFile = path.join(docsPath, 'INSTALLATION.md');

    // Check if docs exist
    if (!fs.existsSync(docsPath)) {
        console.error(colors.status.error + ' ' + chalk.red.bold('Documentation not found'));
        console.log(chalk.gray('   Expected location: ' + docsPath));
        process.exit(1);
    }

    if (options.web) {
        // Generate HTML and open in browser
        await openInBrowser(usageFile, installFile);
    } else if (options.glow) {
        // Try to render with glow
        await renderWithGlow(usageFile);
    } else {
        // Default: render in terminal with marked-terminal
        renderInTerminal(usageFile, installFile);
    }
}

function renderInTerminal(usageFile, installFile) {
    try {
        const { marked } = require('marked');
        const markedTerminal = require('marked-terminal');
        marked.use(markedTerminal.default || markedTerminal);
    } catch (error) {
        // Fallback to simple rendering if marked-terminal not available
    }

    console.log('');
    console.log(chalk.bold.cyan('═'.repeat(80)));
    console.log(chalk.bold.white('                      PORT AUTHORITY DOCUMENTATION                         '));
    console.log(chalk.bold.cyan('═'.repeat(80)));
    console.log('');

    // Read and render USAGE.md
    if (fs.existsSync(usageFile)) {
        const usageContent = fs.readFileSync(usageFile, 'utf8');
        try {
            const { marked } = require('marked');
            console.log(marked(usageContent));
        } catch (error) {
            console.log(usageContent);
        }
    }

    console.log('');
    console.log(chalk.bold.cyan('─'.repeat(80)));
    console.log('');

    // Read and render INSTALLATION.md
    if (fs.existsSync(installFile)) {
        const installContent = fs.readFileSync(installFile, 'utf8');
        try {
            const { marked } = require('marked');
            console.log(marked(installContent));
        } catch (error) {
            console.log(installContent);
        }
    }

    console.log('');
    console.log(chalk.gray('💡 Tip: Use ') + chalk.cyan.bold('--glow') + chalk.gray(' for better rendering or ') + chalk.cyan.bold('--web') + chalk.gray(' to open in browser'));
    console.log('');
}

async function renderWithGlow(usageFile) {
    // Check if glow is installed
    const glow = spawn('which', ['glow']);

    glow.on('close', (code) => {
        if (code !== 0) {
            console.error(colors.status.error + ' ' + chalk.red.bold('Glow is not installed'));
            console.log('');
            console.log(chalk.yellow('Install glow to use this feature:'));
            console.log(chalk.cyan('  brew install glow') + chalk.gray('  # macOS'));
            console.log(chalk.cyan('  go install github.com/charmbracelet/glow@latest') + chalk.gray('  # Go'));
            console.log('');
            console.log(chalk.gray('Falling back to terminal renderer...'));
            console.log('');

            const installFile = path.join(path.dirname(usageFile), 'INSTALLATION.md');
            renderInTerminal(usageFile, installFile);
            return;
        }

        // Glow is installed, use it
        console.log('');
        console.log(chalk.bold.cyan('📖 Opening documentation with glow...'));
        console.log('');

        const glowProcess = spawn('glow', [usageFile], { stdio: 'inherit' });

        glowProcess.on('error', (err) => {
            console.error(colors.status.error + ' ' + chalk.red('Failed to launch glow:'), err.message);
        });
    });
}

async function openInBrowser(usageFile, installFile) {
    // Create a temporary HTML file
    const usageContent = fs.readFileSync(usageFile, 'utf8');
    const installContent = fs.readFileSync(installFile, 'utf8');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Port Authority Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            line-height: 1.6;
            color: #333;
            background: #f6f8fa;
        }
        h1, h2, h3 { color: #0366d6; }
        h1 { border-bottom: 3px solid #0366d6; padding-bottom: 10px; }
        h2 { border-bottom: 1px solid #e1e4e8; padding-bottom: 8px; margin-top: 40px; }
        code {
            background: #f6f8fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        }
        pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 6px;
            overflow-x: auto;
        }
        pre code {
            background: none;
            color: #f8f8f2;
        }
        .section {
            background: white;
            padding: 30px;
            margin-bottom: 20px;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="section">
        ${markdownToHtml(usageContent)}
    </div>
    <div class="section">
        ${markdownToHtml(installContent)}
    </div>
</body>
</html>
    `;

    const tmpFile = path.join('/tmp', 'portauth-docs.html');
    fs.writeFileSync(tmpFile, html);

    console.log('');
    console.log(colors.status.success + ' ' + chalk.green.bold('Opening documentation in browser...'));
    console.log('');

    try {
        await open(tmpFile);
    } catch (error) {
        console.error(colors.status.error + ' ' + chalk.red('Failed to open browser:'), error.message);
        console.log(chalk.gray('   Documentation saved to: ' + tmpFile));
    }
}

function markdownToHtml(markdown) {
    // Simple markdown to HTML conversion
    return markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+)$/gim, '<p>$1</p>')
        .replace(/<\/p><p><h/g, '</p><h')
        .replace(/<\/h(\d)><\/p>/g, '</h$1>')
        .replace(/<p><pre>/g, '<pre>')
        .replace(/<\/pre><\/p>/g, '</pre>');
}

module.exports = docsCommand;
