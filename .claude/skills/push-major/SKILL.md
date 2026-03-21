---
name: push-major
description: Bump major version, run full pre-release checklist, commit all session changes, push, and tag
---

# Push Major Version

A major release requires passing a full readiness checklist before tagging. Follow these steps exactly — do not skip or reorder them.

## Step 0 — Branch check
Check `git branch --show-current`. **DO NOT CONTINUE IF WE ARE ON A BRANCH.** Major versions must be released from `main`.

## Step 1 — Read current version
Read `package.json` and extract the current `version` field. Parse as `major.minor.patch`. The new version increments `major` by 1 and resets `minor` and `patch` to `0`.

Display the version change (e.g., `0.11.3 → 1.0.0`) and **ask the user for confirmation** before proceeding. DO NOT continue without explicit approval.

## Step 2 — Run the full test suite
```bash
npm test
```
If any tests fail, **run each failing test individually** (parallel failures are sometimes spurious). Report results.

**DO NOT CONTINUE if real failures exist.** Fix them first or get explicit user approval to proceed with known failures documented.

## Step 3 — Pre-release checklist review
Read `docs/prerelease-review.md`. Review every item under **🔴 Must Do** and **🟡 Should Do**.

- **🔴 Must Do** items: block the release — resolve each one or get explicit user sign-off
- **🟡 Should Do** items: present to user and confirm which are acceptable to defer

Report the status of each item to the user and get their go/no-go confirmation before continuing.

## Step 4 — Security check
```bash
npm audit --audit-level=high
```
Report any high or critical vulnerabilities. **DO NOT CONTINUE with high/critical vulnerabilities** unless the user explicitly accepts the risk with a written reason.

## Step 5 — Build verification
```bash
npm run build
npm run type-check
```
Both must pass cleanly. Report any errors.

## Step 6 — Update version
Update the `version` field in `package.json` to the new major version.

## Step 7 — Update changelog
**Update `docs/changelog.md`**: Add a new entry at the top (below the header) for the new version with today's date. A major release entry should include:
- A brief statement of what this version represents (stability milestone, API stability, etc.)
- Summary of major features added since the previous major version (or since the project started, for 1.0)
- Any breaking changes
- Migration notes if applicable

Follow the existing format. Newest versions must always be at the top.

## Step 8 — Stage and commit
Run `git status` to review all changed, added, and untracked files. Automatically include files worked on during this session. For any other files not touched, **ask the user whether to include or exclude them**.

Create a brief summary of what this major release represents.

Stage all confirmed files (including `docs/changelog.md`) and commit:
```
<summary of major release>. {old_version} -> {new_version}
```
Example: `stable 1.0 release with full test coverage and accessibility support. 0.11.3 -> 1.0.0`

## Step 9 — Push and tag
```bash
git push
git tag v{new_version} && git push origin v{new_version}
```

## Step 10 — Confirm
Report completion to the user with:
- New version and tag
- Note that GitHub Actions will publish the built package to npm automatically
