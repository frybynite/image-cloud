# Contributing to Image Cloud

Thanks for your interest in contributing!

## Getting Started

```bash
git clone https://github.com/frybynite/image-cloud.git
cd image-cloud
npm install
```

## Development

```bash
npm run dev       # Start dev server with hot reload
npm run serve     # Serve on http://localhost:8080
npm run build     # Production build
npm run type-check  # TypeScript type checking
```

## Testing

Tests use [Playwright](https://playwright.dev/). The test server starts automatically when you run the suite.

```bash
npm test              # Run all tests (headless)
npm run test:headed   # Run with browser visible
npm run test:ui       # Run with Playwright UI
```

After running all tests, if any fail, run the failing specs individually to rule out parallel-execution flakiness before investigating further.

## Making Changes

1. Fork the repository and create a feature branch from `main`
2. Make your changes
3. Add or update tests to cover your change
4. Run the full test suite — all tests must pass
5. Open a Pull Request against `main`

### Adding a Layout

Every new layout needs:
- A placement class in `src/layouts/` implementing the layout interface
- An entry in the layout factory/config types
- An example in `examples/`
- An option in the configurator (`configurator/`)
- Documentation in `docs/parameters.md`

### Changing a Parameter

When renaming, moving, or changing defaults for any config parameter:
- Update `docs/parameters.md`
- Update configurator labels, values, and help text (include the default in help text)

## Code Style

- TypeScript strict mode — no `any`, no unused locals/parameters
- CSS class names prefixed with `fbn-ic-` (e.g. `fbn-ic-gallery`, `fbn-ic-image`)
- ESM modules (`type: "module"`)

## Reporting Issues

Please use [GitHub Issues](https://github.com/frybynite/image-cloud/issues). Include a minimal reproduction if possible.
