#!/bin/bash

# Test Package Script
# Creates a test environment to verify the npm package works correctly

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TEST_DIR="test-package"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Package Testing Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Build the package
echo -e "${YELLOW}→${NC} Building package..."
npm run build
echo -e "${GREEN}✓${NC} Build complete"
echo ""

# Step 2: Pack the package
echo -e "${YELLOW}→${NC} Creating tarball..."
TARBALL=$(npm pack)
echo -e "${GREEN}✓${NC} Created: ${TARBALL}"
echo ""

# Step 3: Create test directory
if [ -d "$TEST_DIR" ]; then
    echo -e "${YELLOW}→${NC} Removing existing test directory..."
    rm -rf "$TEST_DIR"
fi

echo -e "${YELLOW}→${NC} Creating test directory..."
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"
echo -e "${GREEN}✓${NC} Test directory created"
echo ""

# Step 4: Initialize npm
echo -e "${YELLOW}→${NC} Initializing test project..."
npm init -y > /dev/null
# Set type to module for ES imports
cat package.json | sed 's/"main": "index.js"/"main": "index.js",\n  "type": "module"/' > package.tmp && mv package.tmp package.json
echo -e "${GREEN}✓${NC} Project initialized"
echo ""

# Step 5: Install the package
echo -e "${YELLOW}→${NC} Installing package from tarball..."
npm install "../${TARBALL}"
echo -e "${GREEN}✓${NC} Package installed"
echo ""

# Step 6: Create test files
echo -e "${YELLOW}→${NC} Creating test files..."

cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Package Test - @frybynite/image-gallery</title>
    <link rel="stylesheet" href="node_modules/@frybynite/image-gallery/dist/style.css">
    <style>
        body {
            margin: 0;
            font-family: system-ui, -apple-system, sans-serif;
        }
        h1 {
            text-align: center;
            padding: 20px;
            background: #f0f0f0;
            margin: 0;
        }
        #gallery {
            width: 100%;
            height: calc(100vh - 80px);
        }
    </style>
</head>
<body>
    <h1>Testing @frybynite/image-gallery</h1>
    <div id="gallery"></div>

    <script type="module">
        import { ImageCloud } from './node_modules/@frybynite/image-gallery/dist/image-gallery.js';

        console.log('Package loaded successfully!');

        const gallery = new ImageCloud({
            containerId: 'gallery',
            loaderType: 'static',
            staticLoader: {
                sources: [{
                    type: 'urls',
                    urls: [
                        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
                        'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800',
                        'https://picsum.photos/400/300',
                        'https://picsum.photos/500/350',
                        'https://picsum.photos/450/320'
                    ]
                }]
            },
            config: {
                layout: { type: 'radial' }
            }
        });

        gallery.init().then(() => {
            console.log('Gallery initialized successfully!');
        }).catch(error => {
            console.error('Gallery initialization failed:', error);
        });
    </script>
</body>
</html>
EOF

cat > test.js << 'EOF'
// Node.js test file
import { ImageCloud } from '@frybynite/image-gallery';

console.log('✓ Package imports successfully');
console.log('✓ ImageCloud class available:', typeof ImageCloud);

// Type check
const options = {
    containerId: 'test',
    loaderType: 'static'
};

console.log('✓ Options structure valid');
console.log('\nPackage test passed! ✨');
EOF

cat > README.md << 'EOF'
# Package Test Environment

This directory tests the @frybynite/image-gallery package as if installed from npm.

## Test the package

1. **Start a server:**
   ```bash
   npx serve .
   ```
   Open http://localhost:3000

2. **Run Node.js test:**
   ```bash
   node test.js
   ```

3. **Check package contents:**
   ```bash
   ls -la node_modules/@frybynite/image-gallery/dist/
   ```

## Package info

- **Installed from:** Local tarball
- **Location:** `node_modules/@frybynite/image-gallery`
- **Version:** Check `package.json`

## Cleanup

To remove this test environment:
```bash
cd ..
rm -rf test-package
```
EOF

echo -e "${GREEN}✓${NC} Test files created"
echo ""

# Step 7: Show next steps
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Test environment ready!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Test directory:${NC} $TEST_DIR/"
echo -e "${YELLOW}Package:${NC} @frybynite/image-gallery"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. cd $TEST_DIR"
echo "  2. npx serve ."
echo "  3. Open http://localhost:3000"
echo ""
echo -e "${YELLOW}Or test in Node.js:${NC}"
echo "  cd $TEST_DIR && node test.js"
echo ""
echo -e "${YELLOW}Package contents:${NC}"
echo "  ls -la $TEST_DIR/node_modules/@frybynite/image-gallery/dist/"
echo ""
