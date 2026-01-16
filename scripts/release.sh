#!/bin/bash

# Release script for Image Gallery Library
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BUMP_TYPE=${1:-patch}

if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo -e "${RED}Error: Invalid version bump type${NC}"
  echo "Usage: ./scripts/release.sh [patch|minor|major]"
  exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Image Gallery Library Release${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}✗${NC} Uncommitted changes detected"
  echo "  Please commit or stash your changes before releasing"
  exit 1
fi
echo -e "${GREEN}✓${NC} Working directory clean"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo -e "${YELLOW}!${NC} Warning: Not on main branch (current: $CURRENT_BRANCH)"
  read -p "Continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}→${NC} Current version: ${CURRENT_VERSION}"

# Bump version
echo -e "${YELLOW}→${NC} Bumping ${BUMP_TYPE} version..."
npm version ${BUMP_TYPE} --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}✓${NC} New version: ${NEW_VERSION}"
echo ""

# Run production build
echo -e "${YELLOW}→${NC} Running production build..."
./scripts/build.sh --production
echo ""

# Run tests (if available)
if grep -q '"test"' package.json; then
  echo -e "${YELLOW}→${NC} Running tests..."
  npm test
  echo ""
fi

# Commit version bump
echo -e "${YELLOW}→${NC} Committing version bump..."
git add package.json package-lock.json
git commit -m "chore: bump version to ${NEW_VERSION}

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
echo -e "${GREEN}✓${NC} Version committed"

# Create git tag
echo -e "${YELLOW}→${NC} Creating git tag v${NEW_VERSION}..."
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"
echo -e "${GREEN}✓${NC} Tag created"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Release v${NEW_VERSION} prepared!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review the changes"
echo "  2. Push to remote: git push && git push --tags"
echo "  3. Publish to npm: npm publish"
echo ""
