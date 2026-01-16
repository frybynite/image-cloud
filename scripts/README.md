# Build Scripts Documentation

This directory contains build and release automation scripts for the Image Gallery library.

## Available Scripts

### NPM Scripts

Run these from the project root using `npm run <script>`:

#### Development

- **`dev`** - Start Vite dev server for development
  ```bash
  npm run dev
  ```

- **`serve`** - Start Python HTTP server on port 8080
  ```bash
  npm run serve
  # Then open http://localhost:8080
  ```

- **`type-check`** - Check TypeScript types without building
  ```bash
  npm run type-check
  ```

#### Building

- **`build`** - Full production build (clean + compile + bundle)
  ```bash
  npm run build
  ```

- **`build:dev`** - Enhanced build with detailed output
  ```bash
  npm run build:dev
  ```

- **`build:prod`** - Production build with validation checks
  ```bash
  npm run build:prod
  ```

- **`build:watch`** - Watch mode for continuous building
  ```bash
  npm run build:watch
  ```

- **`build:types`** - Generate only TypeScript declarations
  ```bash
  npm run build:types
  ```

- **`clean`** - Remove dist directory
  ```bash
  npm run clean
  ```

#### Releasing

- **`release:patch`** - Bump patch version (0.1.0 → 0.1.1)
  ```bash
  npm run release:patch
  ```

- **`release:minor`** - Bump minor version (0.1.0 → 0.2.0)
  ```bash
  npm run release:minor
  ```

- **`release:major`** - Bump major version (0.1.0 → 1.0.0)
  ```bash
  npm run release:major
  ```

### Shell Scripts

#### `build.sh`

Enhanced build script with detailed output and validation.

**Usage:**
```bash
./scripts/build.sh [options]
```

**Options:**
- `--watch`, `-w` - Watch mode for development
- `--production`, `-p` - Production build with checks
- `--help`, `-h` - Show help message

**Examples:**
```bash
# Standard build
./scripts/build.sh

# Production build with validation
./scripts/build.sh --production

# Watch mode
./scripts/build.sh --watch
```

**Features:**
- Clean previous build
- Run TypeScript type check
- Build library with Vite
- Show file sizes (normal and gzipped)
- Production validation checks

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Image Gallery Library Build Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ Cleaning previous build...
✓ Clean complete

→ Running TypeScript type check...
✓ Type check passed

→ Building library...
✓ Build complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Build Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files:
  image-gallery.js                    29K
  image-gallery.umd.js                17K
  index.d.ts                          14K
  style.css                          2.3K

Total size: 220K

Gzipped sizes:
  image-gallery.js: 8.49 KB
  image-gallery.umd.js: 6.16 KB
  style.css: 0.94 KB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Build successful!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### `release.sh`

Automated release script for version bumping and tagging.

**Usage:**
```bash
./scripts/release.sh [patch|minor|major]
```

**Examples:**
```bash
# Patch release (0.1.0 → 0.1.1)
./scripts/release.sh patch

# Minor release (0.1.0 → 0.2.0)
./scripts/release.sh minor

# Major release (0.1.0 → 1.0.0)
./scripts/release.sh major
```

**What it does:**
1. Checks for uncommitted changes
2. Warns if not on main branch
3. Bumps version in package.json
4. Runs production build with validation
5. Runs tests (if available)
6. Commits version bump
7. Creates git tag
8. Shows next steps (push, publish)

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Image Gallery Library Release
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Working directory clean
→ Current version: 0.1.0
→ Bumping patch version...
✓ New version: 0.1.1

→ Running production build...
✓ Build complete

→ Committing version bump...
✓ Version committed

→ Creating git tag v0.1.1...
✓ Tag created

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Release v0.1.1 prepared!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next steps:
  1. Review the changes
  2. Push to remote: git push && git push --tags
  3. Publish to npm: npm publish
```

## Workflow Examples

### Development Workflow

```bash
# Start development server
npm run dev

# In another terminal, watch for changes
npm run build:watch

# Check types while developing
npm run type-check
```

### Build and Test

```bash
# Clean build with validation
npm run build:prod

# Serve and test locally
npm run serve
# Open http://localhost:8080/index.html
```

### Release Workflow

```bash
# 1. Make sure all changes are committed
git status

# 2. Run a patch release
npm run release:patch

# 3. Review the changes
git log -1
git show

# 4. Push to remote
git push && git push --tags

# 5. Publish to npm (if ready)
npm publish
```

## Build Outputs

After running any build command, the `dist/` directory will contain:

```
dist/
├── image-gallery.js          # ESM bundle (29KB, 8.5KB gzipped)
├── image-gallery.js.map      # ESM source map
├── image-gallery.umd.js      # UMD bundle (17KB, 6.2KB gzipped)
├── image-gallery.umd.js.map  # UMD source map
├── index.d.ts                # TypeScript declarations (14KB)
└── style.css                 # Extracted styles (2.3KB, 0.9KB gzipped)
```

## Troubleshooting

### "Permission denied" when running scripts

```bash
chmod +x scripts/*.sh
```

### Type check fails

```bash
# See detailed errors
npx tsc --noEmit
```

### Build fails

```bash
# Clean and rebuild
npm run clean
npm run build
```

### Can't publish to npm

Make sure you're logged in:
```bash
npm login
npm whoami
```

## Notes

- All scripts assume you're in the project root directory
- Build scripts will fail if TypeScript has errors
- Release scripts require a clean working directory
- Use `--production` flag for final builds before publishing
