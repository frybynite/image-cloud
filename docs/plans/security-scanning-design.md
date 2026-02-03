# Security Scanning Design

Gate npm publishing on security checks and add ongoing vulnerability monitoring.

## Overview

Add security scanning to the publish-npm workflow so packages are only published when:
1. CodeQL static analysis passes (no security issues in code)
2. npm audit passes (no high/critical vulnerabilities in dependencies)

Additionally, set up Dependabot for ongoing weekly vulnerability monitoring.

## Workflow Structure

```
┌─────────────────┐     ┌─────────────────┐
│   security      │────▶│    publish      │
│                 │     │                 │
│ • CodeQL scan   │     │ • npm audit     │
│   (JS/TS)       │     │ • Build         │
│                 │     │ • Version check │
│                 │     │ • npm publish   │
└─────────────────┘     └─────────────────┘
```

### Triggers

- `push` to `v*` tags (existing behavior)
- `workflow_dispatch` for manual testing

### Security Job

Runs CodeQL analysis on JavaScript/TypeScript code:
- Uses `github/codeql-action/init@v3` and `github/codeql-action/analyze@v3`
- Language: `javascript-typescript`
- Results appear in GitHub Security tab
- Fails workflow if security issues found

### Publish Job

- Depends on security job (`needs: security`)
- Only runs on version tags (`if: startsWith(github.ref, 'refs/tags/v')`)
- Runs `npm audit --audit-level=high` after `npm ci`
- Blocks on high/critical vulnerabilities only (moderate/low pass)

## Dependabot Configuration

Weekly scanning of npm dependencies:
- Interval: weekly
- Open PR limit: 5
- Auto-creates PRs when vulnerabilities discovered

## Secret Scanning

Enable in GitHub repository settings:
Settings → Security → Code security and analysis → Secret scanning

This is a repository toggle, not a code configuration.

## Publish-Pages Dependency

Change publish-pages to only run after successful npm publish:

```
v* tag push
    │
    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  security    │────▶│   publish    │────▶│ deploy-pages │
│  (CodeQL)    │     │  (npm)       │     │  (GH Pages)  │
└──────────────┘     └──────────────┘     └──────────────┘
```

- Remove `push: branches: [main]` trigger
- Add `workflow_run` trigger on "Publish to npm" completion
- Only deploy if npm publish succeeded

## Files Changed

1. **Modify** `.github/workflows/publish-npm.yml`
   - Add `workflow_dispatch` trigger
   - Add `security` job with CodeQL
   - Add `npm audit --audit-level=high` to publish job
   - Add `needs: security` dependency
   - Add `if` condition for version tags on publish job

2. **Modify** `.github/workflows/publish-pages.yml`
   - Change trigger from `push: branches: [main]` to `workflow_run`
   - Add condition to only run on successful npm publish

3. **Create** `.github/dependabot.yml`
   - npm ecosystem
   - Weekly schedule
   - 5 PR limit

## Manual Steps

- [ ] Enable secret scanning in repository settings after merge
