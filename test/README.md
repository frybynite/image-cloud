# ImageCloud Test Suite

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/e2e/static-loader.spec.ts

# Run tests in UI mode
npm run test:ui

# Run tests with headed browser
npm run test:headed

# Update snapshots
npm run test:update-snapshots
```

## Test Categories

- **initialization** - Container resolution, config merging
- **static-loader** - Static image loading from URLs/paths
- **google-drive-loader** - Google Drive API integration (requires API key)
- **layout** - Radial and random layout algorithms
- **animation** - Animation timing and easing
- **interaction** - Focus/unfocus user interactions
- **responsive** - Responsive breakpoints and resizing
- **backward-compat** - Legacy configuration adapter
- **auto-init** - HTML attribute auto-initialization

## Environment Variables

- `GOOGLE_DRIVE_API_KEY` - Required for Google Drive tests
