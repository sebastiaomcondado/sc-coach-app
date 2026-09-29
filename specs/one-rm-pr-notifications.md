# 1RM PR Notifications

## Objective
Surface it automatically when an athlete's workout data produces a new estimated 1RM that beats their current best logged test result, so the coach doesn't have to manually visit each athlete's Tests page to check. The coach still reviews and confirms before anything is logged as a real test result — this makes the existing suggestion easier to notice, it doesn't remove the confirmation step.

## Requirements

### Roster indicator
- On the coach's roster page, any athlete with at least one qualifying new-PR suggestion (see "What qualifies" below) shows a small dot/icon indicator next to their row. A generic flag, not a count.
- An athlete with no qualifying suggestions shows no indicator.
- Clicking the indicator (or the athlete's row, as today) takes the coach to that athlete's Tests page.

### Per-test flags on the Tests page
- On an athlete's Tests page, each of the 4 fixed 1RM test types (Back Squat 1RM, Deadlift 1RM, Bench Press 1RM, Row 1RM) that currently qualifies shows its own flag/indicator — visible without the coach having to select it from the test-type dropdown first (e.g. shown in or next to the dropdown option, or as a small list).
- Clicking a flagged test's indicator switches the dropdown to that test type and pre-fills the suggested value into the Value field of the existing log form — the same pre-fill the "Use this" button already produces. The coach still reviews and clicks "Log result" to save; nothing is saved automatically.

### What qualifies
- A test type qualifies for an athlete when the existing auto-suggestion logic (Epley formula, computed from logged sets of exercises tagged with that test's 1RM category) produces an estimate that is **strictly greater than** the athlete's current personal best logged result for that test.
- If the athlete has no logged test result for that test at all yet, any estimate qualifies (there's nothing to beat).
- If there's no suggestion available at all (no tagged exercise, or no logged sets for one), that test does not qualify — same as today's "no suggestion offered" behavior.

### Dismissing a flag
- Next to each flagged test's indicator on the Tests page, the coach can dismiss it individually without logging a result.
- Dismissing a test remembers the specific estimated value that was dismissed for that athlete+test.
- The flag stays cleared as long as the current estimate does not exceed the dismissed value. If a later workout pushes the estimate higher than what was dismissed, the test re-flags at the new value.
- Once the coach logs a result for that test (via the normal Save flow, whether they got there through a flag or not), the flag clears — the newly logged result becomes the athlete's best, so the same estimate no longer beats it.

### Out of scope
- Any change to the existing manual "log a test result" flow itself — the suggestion pre-fill and Save button behave exactly as they do today.
- Showing this to the athlete — this is a coach-facing feature only, consistent with the existing rule that only the coach logs test results.
- Custom (non-fixed) test types — the underlying suggestion mechanism only exists for the 4 fixed 1RM tests tagged via the exercise library's "counts toward 1RM" field, and this feature doesn't extend that.
- Any notification outside the app (email, push) — this is purely a visual indicator inside the roster/Tests pages.
- An "undo" for a dismissal — once dismissed, the only way to see that test flagged again is a higher estimate coming in.

## Edge Cases
- When an athlete has no logged sets for any tagged exercise, no test qualifies and they show no roster indicator.
- When an athlete already holds the best possible estimate as their logged test result (estimate does not exceed their best), that test does not flag.
- When a coach manually logs a new test result higher than the current estimate (without going through a flag), that test's flag clears immediately, since the logged result is now the best.
- When a coach dismisses a flagged test and a later workout produces a higher estimate than the dismissed value, that test re-flags at the new value.
- When a coach dismisses a flagged test and later workouts only produce estimates at or below the dismissed value, that test stays unflagged.
- When all of an athlete's qualifying tests have been logged or dismissed, their roster indicator disappears.

## Definition of Done
- [ ] The roster page shows a dot/icon next to any athlete with at least one qualifying new-PR suggestion, and no indicator for athletes with none.
- [ ] An athlete's Tests page shows a flag on each of the 4 fixed 1RM tests that currently qualifies, visible without first selecting that test from the dropdown.
- [ ] Clicking a flagged test switches the dropdown to it and pre-fills the suggested value into the Value field, without saving anything automatically.
- [ ] The coach can dismiss an individual flagged test from the Tests page without logging a result.
- [ ] A dismissed test stays unflagged until a new estimate exceeds the specific value that was dismissed, at which point it re-flags.
- [ ] Logging a result for a flagged test (accepting the suggestion or typing a different value) clears that test's flag.
- [ ] An athlete's first-ever estimate for a test (no prior logged result) qualifies and flags, same as any estimate that beats an existing best.
