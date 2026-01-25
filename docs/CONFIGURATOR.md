# Interactive Gallery Configurator

The Gallery Configurator is a visual tool for creating and customizing Image Cloud gallery configurations. It provides real-time preview and generates JSON configuration that you can copy to your own projects.

## Accessing the Configurator

```bash
npm run serve
# Navigate to http://localhost:8080/configurator/
```

Or use any static file server to serve the project directory.

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

#### Layout

- **Algorithm**: radial, grid, spiral, cluster, random
- **Sizing**: Base height, variance (min/max)
- **Adaptive Sizing**: Auto-size based on container (min/max, coverage, density)
- **Rotation**: Enable/disable with degree range
- **Spacing**: Padding and minimum gap
- **Algorithm-Specific**: Options for grid (columns, jitter), spiral (type, direction), cluster (count, spread)

#### Animation

- **Duration**: General animation duration
- **Queue**: Enable queued animations with interval
- **Entry Animation**: Start position, offset, duration, stagger

#### Interaction

- **Focus Scale**: How much to zoom on focus (desktop and mobile)
- **Unfocused Opacity**: Opacity of non-focused images
- **Z-Index**: Z-index for focused images

#### Styling

Configure visual appearance for three states:

**Default State**:
- Border (width, color, radius)
- Shadow (preset or custom)
- Opacity
- Filters (grayscale, blur, brightness, contrast, saturate, sepia, hue-rotate)

**Hover State**:
- Shadow
- Filters (grayscale, brightness)

**Focused State**:
- Shadow
- Filters (grayscale)

## Using Generated Configuration

1. Configure your gallery using the visual controls
2. Click "Show Config JSON"
3. Copy the generated JSON
4. Paste into your application code:

```javascript
import { ImageGallery } from 'image-cloud';

const gallery = new ImageCloud({
  container: 'myGallery',
  loader: {
    type: 'static',
    static: {
      sources: [{ type: 'urls', urls: myImageUrls }]
    }
  },
  // Paste generated config here:
  layout: {
    algorithm: 'radial',
    rotation: { enabled: true, range: { min: -15, max: 15 } }
  },
  styling: {
    default: { shadow: 'md' }
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
