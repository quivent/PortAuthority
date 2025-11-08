# 🎨 Subway Authority - Visual Design Specifications

## Design Philosophy

Subway Authority transforms technical port management into an engaging visual experience by adopting the iconic NYC MTA subway aesthetic. Every design decision references authentic subway design patterns, from Helvetica Neue typography to the official line color palette.

## Color System

### Primary Brand Colors

```css
/* Port Authority Blue (Primary) */
--pa-blue-primary: #0039A6;    /* Based on MTA blue */
--pa-blue-secondary: #004AAD;  /* Hover/active states */

/* Base Colors */
--pa-white: #FFFFFF;
--pa-black: #000000;
```

### MTA Subway Line Colors (Service Types)

Each service type maps to an authentic NYC subway line color:

| Service Type | Color | Line Reference | Usage |
|-------------|-------|----------------|-------|
| Node.js | `#00933C` | 4-5-6 Lexington Green | Express services |
| Python | `#FCCC02` | N-Q-R-W Broadway Yellow | Common services |
| Ruby | `#EE352E` | 1-2-3 Seventh Ave Red | Legacy services |
| Go | `#0039A6` | A-C-E Eighth Ave Blue | Performance services |
| Rust | `#FF6319` | B-D-F-M Sixth Ave Orange | System services |
| Java | `#996633` | J-Z Nassau Brown | Enterprise services |
| Docker | `#808183` | L Canarsie Grey | Container services |
| Unknown | `#A7A9AC` | Shuttle Grey | Unidentified services |

### Status Colors (Health Indicators)

```css
--status-healthy: #00933C;    /* Green - Good service */
--status-warning: #FCCC02;    /* Yellow - Delays */
--status-error: #EE352E;      /* Red - Service issues */
--status-info: #0039A6;       /* Blue - Information */
--status-alert: #FF6319;      /* Orange - Attention needed */
```

### Grey Scale (Interface Elements)

```css
--pa-grey-50: #F8F9FA;     /* Background */
--pa-grey-100: #E6E6E6;    /* Subtle borders */
--pa-grey-200: #CCCCCC;    /* Dividers */
--pa-grey-400: #999999;    /* Disabled text */
--pa-grey-600: #666666;    /* Secondary text */
--pa-grey-800: #333333;    /* Primary text */
--pa-grey-900: #1A1A1A;    /* Headings */
```

## Typography

### Font Families

```css
--font-primary: 'Helvetica Neue', Helvetica, Arial, sans-serif;
--font-mono: 'SF Mono', Monaco, 'Courier New', monospace;
```

**Rationale**: Helvetica Neue is the official NYC subway signage font since 1989. We use it throughout the interface for authenticity. Monospace fonts display technical data (ports, PIDs, metrics).

### Type Scale

| Size | Pixels | Usage |
|------|--------|-------|
| xs | 12px | Timestamps, metadata |
| sm | 14px | Body text, labels |
| base | 16px | Standard text |
| lg | 18px | Section headers |
| xl | 20px | Emphasized text |
| 2xl | 24px | Card titles |
| 3xl | 30px | Page headers |

### Font Weights

- **400** (Regular): Body text
- **500** (Medium): Labels, metadata
- **600** (Semibold): Navigation, buttons
- **700** (Bold): Headers, emphasis

### Text Styles

```css
/* Headers (Uppercase, Bold, Tracked) */
.header-primary {
  font-size: 24px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--pa-white);
}

/* Station Names (Medium, Clear) */
.station-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--pa-grey-800);
}

/* Port Numbers (Monospace, Bold) */
.port-number {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--pa-white);
}
```

## Component Specifications

### Station (Port Representation)

**Visual Design:**
- Circle diameter: 24px (12px radius) default, 32px (16px radius) selected
- Stroke: 2px white border (3px when selected)
- Fill: Health status color
- Pulse animation for active connections

**States:**
1. **Default**: Static circle with subtle shadow
2. **Hover**: Slight brightness increase (1.2x), stroke increases to 3px
3. **Selected**: Larger size (16px radius), enhanced glow, drop shadow
4. **Active**: Pulsing outer ring animation (2s duration)

**Accessibility:**
- Focus outline: 2px solid blue, 2px offset
- Minimum touch target: 44x44px (WCAG 2.1 AAA)
- Contrast ratio: 4.5:1 minimum for labels

### Subway Lines

**Visual Design:**
- Line width: 4px (standard), 6px (express)
- Stroke: Service type color at 80% opacity
- Line style: Rounded caps and joins
- Path: Smooth curves using quadratic Bezier

**Express Lines:**
- Double line effect with white dashed overlay
- Dash pattern: 10px dash, 10px gap
- Opacity: 50% for overlay

**Animated Flow:**
- Moving train indicators: 8px diameter circles
- Animation duration: 6s (express), 8s (local)
- Easing: Linear for consistent flow

### Service Alerts

**Layout:**
- Fixed position: top-right corner
- Width: 380px
- Max height: 90vh
- Border radius: 12px
- Box shadow: Large elevation (0 20px 25px rgba(0,0,0,0.1))

**Alert Card:**
- Left border: 4px solid severity color
- Background: Severity color at 5% opacity
- Padding: 16px
- Border radius: 8px

**Animation:**
- Enter: Slide from right (200ms ease-out)
- Exit: Fade out (300ms)
- Pulse indicator: 2s infinite

### Station Board

**Layout:**
- Fixed position: bottom-left corner
- Width: 480px
- Max height: 90vh
- Border radius: 12px
- Header: Blue background with white text

**Information Sections:**
1. **Service Info**: 2-column grid of key-value pairs
2. **Domain Mappings**: List with status badges
3. **Performance Metrics**: 2-column grid of numeric data
4. **Quick Actions**: 2-column button grid

**Data Presentation:**
- Labels: 12px, uppercase, grey
- Values: 16px, bold, black
- Monospace: For technical data (ports, PIDs)

### Map Controls

**Layout:**
- Fixed position: top-left corner
- Vertical button stack
- Width: 40px per button
- Height: 40px per button

**Button Design:**
- Background: White
- Border: None
- Border radius: 8px (individual) or grouped corners
- Icon: 20x20px, grey
- Hover: Blue background, white icon

**Tooltip:**
- Position: Right of button
- Background: Dark grey (90% opacity)
- Text: White, 12px
- Padding: 4px 8px
- Border radius: 4px

## Animation Specifications

### Transitions

```css
--transition-fast: 150ms ease-in-out;   /* Hovers, toggles */
--transition-base: 200ms ease-in-out;   /* Standard */
--transition-slow: 300ms ease-in-out;   /* Panels, modals */
```

### Station Animations

**Pulse (Active Connections):**
```css
@keyframes pulse {
  0%, 100% {
    r: 12px;
    opacity: 0.5;
  }
  50% {
    r: 20px;
    opacity: 0;
  }
}
```

**Hover Scale:**
```css
.station:hover {
  transform: scale(1.1);
  transition: transform 150ms ease-out;
}
```

### Data Flow Animation

**Moving Train:**
```svg
<circle r="4" fill="lineColor">
  <animateMotion
    dur="6s"
    repeatCount="indefinite"
    path="linePath" />
</circle>
```

**Dashed Line Flow:**
```css
@keyframes flow {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -20; }
}
```

### Panel Animations

**Slide In (Service Alerts):**
```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

**Slide In (Station Board):**
```css
@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## Interactive States

### Hover Effects

**Stations:**
- Brightness: 120%
- Stroke width: 3px
- Cursor: pointer
- Transition: 150ms

**Buttons:**
- Background: Primary blue
- Color: White
- Transform: translateY(-1px)
- Shadow: Medium elevation

**Alert Cards:**
- Transform: translateX(-2px)
- Shadow: Increased elevation

### Focus States (Accessibility)

```css
*:focus-visible {
  outline: 2px solid var(--pa-blue-primary);
  outline-offset: 2px;
}
```

### Selection States

**Selected Station:**
- Radius: 16px (33% increase)
- Stroke: 3px white
- Filter: Drop shadow + glow
- Label: Bold weight

## Responsive Breakpoints

```css
/* Desktop: Full features */
@media (min-width: 1024px) {
  /* All features enabled */
}

/* Tablet: Optimized layout */
@media (max-width: 1024px) {
  /* Simplified legend */
  /* Stacked layouts */
}

/* Mobile: Essential features */
@media (max-width: 768px) {
  /* Compact controls */
  /* Hidden labels */
  /* Touch-optimized targets */
}
```

## Accessibility Standards

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Touch Targets:**
- Minimum size: 44x44px
- Spacing: 8px between targets

**Keyboard Navigation:**
- Tab order: Logical flow
- Focus indicators: Visible outlines
- Escape key: Close panels

**Screen Reader Support:**
- Semantic HTML: Proper heading hierarchy
- ARIA labels: Descriptive button names
- Alt text: SVG descriptions
- Live regions: Status updates

## Performance Optimizations

### SVG Rendering

```css
/* GPU acceleration */
.station,
.subway-line {
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
```

### Animation Performance

- Use `transform` and `opacity` only (GPU-accelerated)
- Avoid `width`, `height`, `top`, `left` animations
- Debounce scroll/resize handlers
- Use `requestAnimationFrame` for smooth updates

### Bundle Optimization

- Code splitting: Route-based chunks
- Tree shaking: Remove unused code
- Image optimization: SVG compression
- Lazy loading: Below-fold components

## Design Tokens (CSS Custom Properties)

All design values use CSS custom properties for:
- **Consistency**: Single source of truth
- **Theming**: Easy dark mode support
- **Maintainability**: Update once, apply everywhere

Example usage:
```css
.station-label {
  font-size: var(--font-size-sm);
  color: var(--pa-grey-800);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
}
```

## Brand Guidelines

### Logo Usage
- Always use official NYC MTA blue (#0039A6)
- Minimum size: 32px height
- Clear space: 16px on all sides

### Typography Hierarchy
- Never use more than 3 font sizes per view
- Maintain 1.5 line height for readability
- Limit line length to 70 characters

### Color Application
- Use line colors for service type only
- Status colors for health indicators only
- Grey scale for all UI chrome
- Blue brand color for primary actions

---

**Design Version**: 1.0.0
**Last Updated**: 2025-11-07
**Agent**: UI-Frontend-2025-09-04
