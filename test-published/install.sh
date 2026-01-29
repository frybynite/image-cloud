#!/bin/bash
# Install the published @frybynite/image-cloud package
#
# Usage:
#   ./install.sh          # Install latest version
#   ./install.sh 0.1.0    # Install specific version

set -e

VERSION=${1:-latest}

echo "Installing @frybynite/image-cloud@$VERSION..."

if [ "$VERSION" = "latest" ]; then
    npm install @frybynite/image-cloud@latest
else
    npm install @frybynite/image-cloud@$VERSION
fi

echo ""
echo "Installing dev dependencies..."
npm install

echo ""
echo "Installed version:"
npm list @frybynite/image-cloud

echo ""
echo "Ready to test!"
echo ""
echo "For npm package tests (Vite dev server):"
echo "  npm run dev"
echo "  Open: http://localhost:5180/"
echo ""
echo "For CDN tests (no install needed):"
echo "  npm run serve-cdn"
echo "  Open: http://localhost:3001/cdn-static.html"
echo "        http://localhost:3001/cdn-google-drive.html"
