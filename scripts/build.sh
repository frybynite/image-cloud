#!/bin/bash

# Build script for Image Gallery Library
# Usage: ./scripts/build.sh [--watch] [--production]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
WATCH=false
PRODUCTION=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --watch|-w)
      WATCH=true
      shift
      ;;
    --production|-p)
      PRODUCTION=true
      shift
      ;;
    --help|-h)
      echo "Usage: ./scripts/build.sh [options]"
      echo ""
      echo "Options:"
      echo "  --watch, -w         Watch mode for development"
      echo "  --production, -p    Production build with optimizations"
      echo "  --help, -h          Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Image Gallery Library Build Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Clean previous build
echo -e "${YELLOW}→${NC} Cleaning previous build..."
rm -rf dist
echo -e "${GREEN}✓${NC} Clean complete"
echo ""

# Step 2: Type checking
echo -e "${YELLOW}→${NC} Running TypeScript type check..."
if npm run type-check; then
  echo -e "${GREEN}✓${NC} Type check passed"
else
  echo -e "${RED}✗${NC} Type check failed"
  exit 1
fi
echo ""

# Step 3: Build
if [ "$WATCH" = true ]; then
  echo -e "${YELLOW}→${NC} Starting watch mode..."
  npm run build:watch
else
  echo -e "${YELLOW}→${NC} Building library..."
  npm run build
  echo -e "${GREEN}✓${NC} Build complete"
  echo ""

  # Step 4: Show build results
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Build Results${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  if [ -d "dist" ]; then
    # List files with sizes
    echo -e "${YELLOW}Files:${NC}"
    ls -lh dist/ | grep -v '^total' | awk '{printf "  %-30s %8s\n", $9, $5}'
    echo ""

    # Calculate total size
    TOTAL_SIZE=$(du -sh dist/ | awk '{print $1}')
    echo -e "${YELLOW}Total size:${NC} $TOTAL_SIZE"
    echo ""

    # Show gzipped sizes for main files
    echo -e "${YELLOW}Gzipped sizes:${NC}"
    if command -v gzip &> /dev/null; then
      for file in dist/image-gallery.js dist/image-gallery.umd.js dist/style.css; do
        if [ -f "$file" ]; then
          GZIP_SIZE=$(gzip -c "$file" | wc -c | awk '{printf "%.2f KB", $1/1024}')
          FILENAME=$(basename "$file")
          echo -e "  ${FILENAME}: ${GZIP_SIZE}"
        fi
      done
    else
      echo "  (gzip not available)"
    fi
    echo ""
  fi

  # Production mode: Additional checks
  if [ "$PRODUCTION" = true ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Production Build Checks${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Check for source maps
    if ls dist/*.map 1> /dev/null 2>&1; then
      echo -e "${GREEN}✓${NC} Source maps generated"
    else
      echo -e "${YELLOW}!${NC} No source maps found"
    fi

    # Check for type declarations
    if [ -f "dist/index.d.ts" ]; then
      echo -e "${GREEN}✓${NC} Type declarations generated"
    else
      echo -e "${RED}✗${NC} Type declarations missing"
    fi

    # Check for CSS
    if [ -f "dist/style.css" ]; then
      echo -e "${GREEN}✓${NC} CSS file generated"
    else
      echo -e "${RED}✗${NC} CSS file missing"
    fi

    echo ""
  fi

  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Build successful!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi
