# Interactive Gallery Configurator

The Gallery Configurator is a visual tool for creating and customizing Image Cloud gallery configurations. It provides real-time preview and generates JSON configuration that you can copy to your own projects.

## Accessing the Configurator

**Online**: [https://frybynite.github.io/image-cloud/configurator/](https://frybynite.github.io/image-cloud/configurator/)

**Local**:
```bash
npm run serve
# Navigate to http://localhost:8080/configurator/
```

## Features

### Real-Time Preview

The configurator displays a live gallery preview that updates automatically as you modify settings. Changes are debounced (300ms delay) to ensure smooth performance.

### Enable/Disable Pattern

Each setting has a checkbox that controls whether it's included in the generated configuration:

- **Unchecked**: Setting uses library defaults, not included in output
- **Checked**: Setting is included in the generated JSON config

This allows you to create minimal configurations that only specify what differs from defaults.

### Eye Toggle (JSON Paths)

Click the eye button in the header to toggle between:
- **Friendly labels**: "Border Width", "Grayscale", etc.
- **JSON paths**: "border.width", "filter.grayscale", etc.

This helps you understand exactly which configuration properties you're modifying.

### Presets

Start with a preset to quickly apply common styles:

| Preset | Description |
|--------|-------------|
| Default | Library defaults - minimal configuration |
| Scattered Photos | Classic scattered look with rotation |
| Clean Grid | Organized grid layout without rotation |
| Polaroid | White borders, warm filter tones |
| Vintage | Sepia tones, reduced saturation |
| Neon Glow | Cyberpunk aesthetic with glowing borders |
| Minimal | Clean look without shadows or rotation |
| Dramatic | High contrast with strong shadows |

Selecting a preset:
1. Clears all current enabled settings
2. Applies the preset's values
3. Enables the relevant checkboxes

You can then customize any setting from the preset starting point.

### Configuration Sections

- **Layout** — Algorithm (radial, grid, spiral, cluster, wave, honeycomb, random), layout controls (coverage, density, scale decay), and spacing
- **Image: Size & Rotation** — Sizing mode (adaptive, fixed, responsive), size bounds, variance, and rotation mode
- **Image: Style** — Border, outline, radius, shadow, clip path, opacity, cursor, and filters — configured independently for Default, Hover, and Focused states
- **Animation** — General duration, queue settings, entry animation (path, rotation, scale modes), and idle animation
- **Interaction** — Focus scale and z-index, keyboard navigation, swipe gestures, and image dragging
- **UI** — Show/hide loading spinner, image counter, nav buttons, and focus outline
- **Config** — URL validation settings, allowed extensions, and debug options

## Using Generated Configuration

1. Configure your gallery using the visual controls
2. Click "Show Config JSON"
3. Copy the generated JSON
4. Paste into your application code:

```javascript
import { ImageGallery } from 'image-cloud';

const gallery = new ImageCloud({
  container: 'myGallery',
  images: myImageUrls,
  // Paste generated config here:
  layout: {
    algorithm: 'radial',
    rotation: { enabled: true, range: { min: -15, max: 15 } }
  }
});

await gallery.init();
```

## Mobile Support

On mobile devices (< 768px viewport):
- Sidebar becomes a slide-out drawer
- Tap the hamburger menu (☰) to toggle the configuration panel
- Gallery takes full screen when sidebar is closed

## Tips

1. **Start with a preset** that's close to your desired look, then customize
2. **Only enable settings you want to change** - this keeps your config minimal
3. **Use the eye toggle** when you need to reference exact JSON paths in documentation
4. **Test different algorithms** - each layout algorithm creates a distinct visual effect
5. **Experiment with filters** - combining subtle filters can create unique aesthetics

## Technical: Field Description Attributes

Each configurator field uses two data attributes to separate description lookup from path display:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-desc-key` | Full canonical path for tooltip lookup in `field-descriptions.json` | `layout.grid.columns` |
| `data-path` | Context-aware partial path shown when eye toggle is active | `grid.columns` |
| `data-label` | Human-readable label shown by default | `Columns` |

`data-desc-key` always matches the nested structure in `field-descriptions.json`. `data-path` omits prefixes already shown by the current section context (e.g., styling fields omit the `styling.` prefix since the state selector already displays `styling.default` / `styling.hover` / `styling.focused`).

The `initTooltips()` function queries `[data-desc-key]` elements and uses `getDescription()` to traverse the JSON. The `togglePaths()` function reads `data-path` for display.
