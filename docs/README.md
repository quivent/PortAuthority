# Porter Documentation

Beautiful, nautical-themed HTML documentation for the Porter CLI.

## Overview

This directory contains the complete documentation system for Porter - The Port Authority for Your Development Environment. The documentation is designed with a maritime/port authority theme featuring navy blues, seafoam greens, and nautical design elements.

## Files

- **landing.html** - Documentation landing page with quick start
- **index.html** - Full comprehensive documentation (self-contained, works offline)
- **quick-reference.html** - Quick command reference and cheat sheet
- **README.md** - This file

## Documentation Pages

### Landing Page (`landing.html`)
Entry point for documentation with:
- Quick start guide
- Links to full docs and quick reference
- Clean, minimal design

### Full Documentation (`index.html`)
Comprehensive guide including:
- Getting started and installation
- Core concepts (subdomain mapping)
- Command reference (NOTE: Currently shows generic port management commands - needs update)
- Common workflows
- Advanced topics
- Troubleshooting and FAQ
- Interactive features (dark/light mode, command search, copy buttons)

### Quick Reference (`quick-reference.html`)
Fast command lookup with:
- **Accurate Porter commands** (set, map, unmap, list, open, tree, docs, reset)
- Usage examples
- Common patterns
- Troubleshooting tips
- Example mappings table

## ⚠️ Important Note

The main `index.html` file currently contains **placeholder content** for generic port management commands. The actual Porter CLI is about **subdomain-to-port mapping**, not general port management.

**Correct Porter functionality:**
- Maps subdomains like `api.localhost` to ports like `3000`
- Manages `/etc/hosts` file automatically
- Provides browser integration
- Stores configuration in `~/.porter/config.toml`

**For accurate command information, use `quick-reference.html`.**

## Features

### Visual Design
- 🎨 **Nautical Theme**: Navy blues, seafoam greens, anchor symbols, maritime metaphors
- 🌓 **Dark/Light Mode**: Automatic theme switching with localStorage persistence
- 📱 **Responsive Design**: Mobile-friendly layout that adapts to all screen sizes
- ♿ **Accessible**: ARIA labels, keyboard navigation, semantic HTML

### Interactive Elements
- 🔍 **Command Search**: Real-time filtering of commands (Ctrl/Cmd+K to focus)
- 📋 **Copy-to-Clipboard**: One-click copy for all code examples
- 🔽 **Collapsible Sections**: Expandable FAQ and content sections
- 🎯 **Smooth Navigation**: Active section highlighting in sidebar
- ⌨️ **Keyboard Shortcuts**: Quick navigation and search

### Content Structure
1. **Hero Section** - Eye-catching introduction with CTA buttons
2. **Getting Started** - What Porter is and why you need it
3. **Installation** - Quick install guide with system requirements
4. **Core Concepts** - Understanding ports, states, and common development ports
5. **Command Reference** - Comprehensive command documentation with examples
   - Port Management Commands
   - Hosts File Management
   - Monitoring & Services
   - Utility Commands
6. **Common Workflows** - Real-world usage patterns
7. **Advanced Topics** - Automation, JSON output, configuration files
8. **Troubleshooting** - Common issues and solutions
9. **FAQ** - Frequently asked questions
10. **Quick Reference** - Cheat sheets and tables

## Usage

### Local Viewing

Simply open `index.html` in any modern web browser:

```bash
# macOS
open docs/index.html

# Linux
xdg-open docs/index.html

# Windows
start docs/index.html
```

### Hosting

The documentation is a single, self-contained HTML file that can be:

1. **Served locally**:
   ```bash
   # Python 3
   cd docs && python3 -m http.server 8000

   # Node.js (with http-server)
   npx http-server docs -p 8000
   ```

2. **Deployed to GitHub Pages**:
   - Push to your repository
   - Enable GitHub Pages in settings
   - Set source to `/docs` folder

3. **Deployed to any static hosting**:
   - Netlify
   - Vercel
   - AWS S3
   - Cloudflare Pages

### Integration with Porter CLI

The documentation can be accessed directly from Porter:

```bash
# Open documentation in browser
porter docs

# Serve documentation locally
porter docs --serve
```

## Customization

### Branding

Update the hero section and footer in `index.html`:

```html
<!-- Update title -->
<h1>⚓ Your CLI Name</h1>

<!-- Update tagline -->
<p class="tagline">Your custom tagline here</p>

<!-- Update links -->
<a href="https://github.com/yourusername/your-cli">GitHub</a>
```

### Color Scheme

Modify CSS variables at the top of the `<style>` section:

```css
:root {
    --navy-deep: #0a1929;
    --seafoam: #4ecdc4;
    /* ... etc ... */
}
```

### Commands

Add new commands in the Command Reference section:

```html
<div class="command-item">
    <div class="command-header">
        <div>
            <div class="command-name">porter yourcommand</div>
            <span class="badge badge-new">New</span>
        </div>
    </div>
    <p class="command-description">
        Description of your command
    </p>
    <!-- ... -->
</div>
```

## Theme Features

### Nautical Design Elements

The documentation uses maritime metaphors throughout:

- **Ports** = Docks where ships berth
- **Services** = Ships in the harbor
- **Port Authority** = Traffic control for the harbor
- **Navigation** = Finding your way through the waters
- **Harbor Master** = The CLI managing everything

### Icons Used

- ⚓ Anchor (main logo)
- 🚢 Ship (getting started)
- 🛟 Life preserver (concepts)
- 🗺️ Map (hosts management)
- 📊 Charts (monitoring)
- 🔧 Tools (utilities)
- 🧭 Compass (navigation)
- 🌊 Waves (maritime theme)

## Accessibility

The documentation follows WCAG 2.1 AA standards:

- Semantic HTML structure
- Proper heading hierarchy
- Sufficient color contrast (4.5:1 minimum)
- Keyboard navigation support
- ARIA labels where appropriate
- Focus indicators
- Screen reader friendly

## Browser Support

Works in all modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Performance

- **Load time**: < 1 second (single file, no external dependencies)
- **Size**: ~60KB (well within HTTP/2 multiplexing limits)
- **No JavaScript frameworks**: Pure vanilla JS
- **Minimal CSS**: Hand-crafted, optimized styles
- **Offline capable**: Works without internet connection

## Print Support

The documentation is print-friendly:

- Optimized print styles
- Auto-expands collapsible sections
- Removes interactive elements (buttons, nav)
- Page breaks at logical sections

To print:
1. Open in browser
2. Press Ctrl/Cmd+P
3. Save as PDF or print

## Contributing

To improve the documentation:

1. Edit `index.html` directly
2. Test in multiple browsers
3. Verify responsive design (mobile/tablet/desktop)
4. Check dark mode appearance
5. Validate HTML: https://validator.w3.org/
6. Test accessibility: https://wave.webaim.org/

## Technical Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern features (Grid, Flexbox, Custom Properties)
- **Vanilla JavaScript**: No frameworks, minimal dependencies
- **Web APIs**: Clipboard API, IntersectionObserver, localStorage

## License

Same license as the Porter CLI project.

## Credits

Documentation design inspired by:
- Modern CLI documentation (Homebrew, ripgrep, bat)
- Maritime design principles
- Developer-friendly color schemes (Nord, Dracula)

---

**Built with 🌊 for developers who value clean harbors and clear documentation**
