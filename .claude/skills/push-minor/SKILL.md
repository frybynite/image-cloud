---
name: push-minor
description: Bump minor version, commit all session changes, push, and tag
---

# Push Minor Version

Follow these steps exactly:

1. Read `package.json` and extract the current `version` field.
2. Parse the version as `major.minor.patch`. Calculate the new version by incrementing `minor` by 1 and resetting `patch` to 0.
3. Display the version change (e.g., `0.3.1 → 0.4.0`) and **ask the user for confirmation** before proceeding. DO NOT continue without explicit approval.
4. Update the `version` field in `package.json` with the new version.
5. Run `git status` to review all changed, added, and untracked files. Automatically include files you worked on during this session. For any other files you did not touch, **ask the user whether to include or exclude them** before committing.
6. Create a brief summary of the work completed in this session (features, fixes, refactors, etc.).
7. **Update `CHANGELOG.md`**: Add a new entry at the top (below the header) for the new version with today's date and the details of what changed. Follow the existing format in the file. Newest versions must always be at the top.
8. Stage all confirmed files (including `CHANGELOG.md`) and commit with message:
   ```
   <quick summary of changes>. {old_version} -> {new_version}
   ```
   Example: `redesigned loader API and added swipe gestures. 0.2.9 -> 0.3.0`
9. Run: `git push`
10. Run: `git tag v{new_version} && git push origin v{new_version}`
11. Confirm completion to the user with the new version and tag.
