# Pre-Release Review

Items identified during a pre-1.0 readiness review. See [backlog.md](backlog.md) for general feature backlog.

---

## Must Fix

### Address 4 skipped swipe gesture tests
In `test/e2e/swipe-gestures.spec.ts`, four core swipe navigation tests are permanently skipped with `test.skip`. The feature is fully implemented and shipping — these should be fixed and enabled or replaced.

---

## Nice to Have

- Fix hover styles not re-applied when cursor is already over image after unfocus (also in active issues)
