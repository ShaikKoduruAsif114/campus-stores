# Verification

## Executed checks

- `node --test tests/kit.test.cjs`: **11 passed, 0 failed**. Covers request progress, exact-unit return validation and named returner, custody reason/history, immutable handover snapshots and links, v1 migration and malformed v2 fallback, original issue guards, draft/focus restoration, and the Film Society vertical shift.
- `node --check app.js`: passed.
- `node --check kit-model.js`: passed.
- `git diff --check`: passed.
- `uv run --with playwright python tests/browser-check.py`: passed in installed Chrome, using the app directly over `file://`.

## Real-browser acceptance scenario

The browser check operates real UI forms rather than injecting the finished state:

1. Issue PR-04, SP-02, AD-12 for RQ-214 to Kabir.
2. Advance to Friday evening; confirm the first two physical returns.
3. Record Leela as AD-12's holder and Saturday 9 am as the agreed return, retaining a reason and original collector.
4. Open the kit: 2 of 3 returned, adapter remains outstanding.
5. Reload and verify persisted custody.
6. Verify a draft handover note survives switching screens; save the generated snapshot.
7. Advance to the morning and verify the pinned snapshot and linked kit.
8. Attempt AD-15 against AD-12's slip: mismatch blocks closure.
9. Return AD-12 as Leela: Film Society completes; MI-09 remains open.
10. Check no horizontal overflow at widths 375 and 768 px.
11. Restart: original phase, single microphone loan, and no saved notes.
12. No JavaScript page errors were recorded.

Results: [browser-results.json](evidence/browser-results.json). Screenshots: `after-*.png` in [evidence](evidence/).

The original baseline was exercised separately with the same issued unit IDs. It includes a real CA-03 / RQ-214 approval rejection and the unstructured evening/morning return flow: [baseline-results.json](evidence/baseline-results.json), `before-*.png`.

## Limits

This is not an exhaustive browser/accessibility audit. The automated layout assertion checks horizontal overflow, not every visual detail. Return-field focus and named-control restoration are checked, but full screen-reader and keyboard-only usability remain manual validation work. No real-counter field study has been performed; the proposed observation is described in [DECISION.md](DECISION.md). Storage-denied behavior is implemented but not exercised by this browser acceptance run. Authentication, concurrency, real timestamps/overdue computation, and deployment are outside this prototype's scope.
