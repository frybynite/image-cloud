# Developer Guide

Instructions for developing and contributing to Image Cloud.

## Build Scripts

The project includes comprehensive build automation:

```bash
# Development
npm run dev              # Start dev server
npm run serve            # Serve on http://localhost:8080
npm run type-check       # Check types only

# Building
npm run build            # Full production build
npm run build:prod       # Build with validation
npm run build:watch      # Watch mode
npm run clean            # Remove dist/

# Releasing - this will only be done by the project owner
npm run release:patch    # 0.1.0 → 0.1.1
npm run release:minor    # 0.1.0 → 0.2.0
npm run release:major    # 0.1.0 → 1.0.0
```

See `scripts/README.md` for detailed documentation.

## Testing

```bash
npm test                 # Run Playwright tests
npm run test:headed      # Run tests with browser visible
npm run test:ui          # Run tests with Playwright UI
```

## Project Structure

```
src/
├── ImageCloud.ts        # Main entry point
├── index.ts             # Public exports
├── config/
│   ├── types.ts         # TypeScript interfaces
│   └── defaults.ts      # Default configuration
├── engines/
│   ├── LayoutEngine.ts  # Position calculations
│   ├── AnimationEngine.ts
│   ├── ZoomEngine.ts
│   └── EntryAnimationEngine.ts
├── generators/          # Layout algorithms
│   ├── RadialPlacementGenerator.ts
│   ├── GridPlacementGenerator.ts
│   ├── SpiralPlacementGenerator.ts
│   ├── ClusterPlacementGenerator.ts
│   ├── WavePlacementGenerator.ts
│   └── RandomPlacementGenerator.ts
└── loaders/
    ├── GoogleDriveLoader.ts
    ├── StaticImageLoader.ts
    └── CompositeLoader.ts
```

## Code Style

- TypeScript with strict mode enabled
- CSS classes prefixed with `fbn-ic-`
- ESM modules (type: "module" in package.json)
- Vite for bundling (UMD and ESM outputs)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a Pull Request

---

## To Do

### Restrict Release Scripts to Project Owner

Currently, release scripts can be run by anyone with repo access. Consider implementing one of these approaches:

- **Rely on npm permissions** - Only the owner has the npm token to publish
- **Add user check in script** - Validate git user against allowed list
- **GitHub branch protection** - Restrict who can push tags matching `v*`
- **GitHub Actions workflow** - Create a release workflow with environment protection rules
- **Keep scripts local** - Remove release scripts from repo, maintain locally only
