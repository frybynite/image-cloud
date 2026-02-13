---
name: push-patch
description: Bump patch version, commit all session changes, push, and tag
---

# Push Patch Version

Follow these steps exactly:

1. Read `package.json` and extract the current `version` field.
2. Parse the version as `major.minor.patch`. Calculate the new version by incrementing `patch` by 1.
3. Display the version change (e.g., `0.3.0 → 0.3.1`) and **ask the user for confirmation** before proceeding. DO NOT continue without explicit approval.
4. Update the `version` field in `package.json` with the new version.
5. Run `git status` to review all changed, added, and untracked files. Automatically include files you worked on during this session. For any other files you did not touch, **ask the user whether to include or exclude them** before committing.
6. Create a brief summary of the work completed in this session (features, fixes, refactors, etc.) to include in the commit message.
7. Stage all confirmed files and commit with message:
   ```
   chore: bump version to {version}

   {summary of session work}
   ```
8. Run: `git push`
9. Run: `git tag v{version} && git push origin v{version}`
10. Confirm completion to the user with the new version and tag.
