# Tests Page

## Objective
Give a coach a dedicated place to log and track physical test results (1RM lifts, speed, jumps, endurance, bodyweight-strength tests) for each athlete over time, compare athletes against each other per test, and estimate 1RM automatically from an athlete's logged workout data — instead of tracking these numbers outside the app.

## Requirements

### Test types
- Eleven fixed, built-in test types, each with a unit and a "higher is better" or "lower is better" direction (used to determine personal bests):
  - Squat 1RM — kg, higher is better
  - Deadlift 1RM — kg, higher is better
  - Bench Press 1RM — kg, higher is better
  - Row 1RM — kg, higher is better
  - Bronco Test — seconds, lower is better
  - Max Speed — seconds (sprint time over a fixed distance the coach tests consistently; the app does not track the distance itself, only the time), lower is better
  - Horizontal Jump — cm, higher is better
  - Vertical Jump — cm, higher is better
  - Max Push-ups — reps, higher is better
  - Max Pull-ups — reps, higher is better
  - Max Plank Hold — seconds, higher is better
- A coach can add **custom test types** beyond the fixed list, each with:
  - A name (e.g. "Beep Test").
  - A unit label (free text, e.g. "level", "reps", "cm").
  - A direction: higher is better, or lower is better.
- Custom tests are coach-owned (each coach manages their own list), same ownership pattern as squad groups.
- Deleting a custom test type also deletes every logged result under it (cascading delete) — a confirmation is required before this happens.

### Logging results
- Only the coach logs test results. Athletes cannot log or edit their own results, only view them.
- Each logged result has: test type, athlete, numeric value, date.
- Full history is kept — every logged result is stored, not just the latest or best.
- A coach can edit or delete a previously logged result (e.g. to fix a typo).

### Per-athlete view (coach side)
- New "Tests" link in the coach nav. Coach picks an athlete, then sees that athlete's results across every test type (fixed + this coach's custom tests).
- For each test type: a line chart of results over time, a table of all logged entries (date + value), and the athlete's personal best highlighted (using that test's higher/lower-is-better direction).
- A test type with zero logged results for that athlete shows an empty state ("No results yet") instead of an empty chart/table.
- Logging a new result and editing/deleting an existing one both happen from this view.

### Comparing athletes
- **Per-test ranked list**: coach picks one test type and sees every athlete's personal best for it, ranked best-to-worst using that test's direction. Athletes with no logged result for that test are excluded from the ranking (not shown as a bottom entry).
- **All-tests comparison table**: one table, rows = athletes, columns = every test type (fixed + custom), each cell showing that athlete's personal best for that test, or "—" if they have none.
- Both views cover the coach's full roster (no group filtering in this pass).

### Athlete view
- New "Tests" link in the athlete nav, showing that athlete's own results — same per-test charts, tables, and personal-best highlighting as the coach's per-athlete view, but read-only and scoped to themselves only.

### 1RM calculation
- **Standalone calculator**: a simple tool (available wherever 1RM is logged) where the coach types in a weight and rep count and immediately sees an estimated 1RM. Not tied to any athlete or saved data unless the coach explicitly logs the result as a test entry.
- **Formula**: Epley — `1RM = weight × (1 + reps / 30)`.
- **Auto-suggestion from logged sets**: exercises in the exercise library get an optional "counts toward 1RM" tag, set by the coach, with one of four values: Squat, Deadlift, Row, Bench Press (or none/unset, the default). When a coach logs a Squat/Deadlift/Row/Bench Press 1RM test result for an athlete, the app looks at that athlete's logged sets for exercises tagged with the matching category, computes an estimated 1RM (Epley formula) for each, and offers the highest one as a suggested value — the coach can accept it as-is or type a different number before saving. If no exercise is tagged for that category, or the athlete has no logged sets for a tagged exercise, no suggestion is offered and the coach just enters a value manually.

### Out of scope
- The separate gamification leaderboards feature (most completed workouts, best weight progress, monthly podium) — that is its own future feature, unrelated to test results.
- Bulk/CSV import of historical test results — entries are logged one at a time through the UI.
- Reordering, grouping, or categorizing test types beyond the fixed list plus custom additions.
- Group-filtered comparisons (the ranked list and comparison table always cover the coach's full roster).
- Editing or deleting a custom test's name/unit/direction after creation (only creation and deletion are supported — no in-place rename/redefine).

## Edge Cases
- When a coach deletes a custom test type that has logged results, those results are deleted along with it, after an explicit confirmation.
- When an athlete has zero results for a given test type, the per-athlete view shows an empty state instead of an empty chart/table.
- When an athlete has no logged result for a test, they're excluded from that test's ranked list (not shown as a blank/last entry), and shown as "—" in the comparison table.
- When no exercise is tagged for a 1RM category (or the athlete has no logged sets for a tagged exercise), logging that 1RM test offers no auto-suggestion — manual entry only.
- When a coach edits a logged test result, the change is reflected immediately in the athlete's history, personal-best calculation, the ranked list, and the comparison table.
- When a coach uses the standalone 1RM calculator, the result is shown immediately but nothing is saved unless they explicitly log it as a test entry.

## Definition of Done
- [ ] A coach can log a result for any of the 11 fixed test types plus any custom test, for any athlete on their roster.
- [ ] A coach can create a custom test with a name, unit label, and higher/lower-is-better direction.
- [ ] A coach can delete a custom test, and doing so removes all of its logged results after a confirmation.
- [ ] A coach can edit and delete any previously logged test result.
- [ ] The per-athlete Tests view shows, for each test type, a chart and table of history plus the personal best highlighted.
- [ ] A test type with no logged results for an athlete shows an empty state, not a broken/empty chart.
- [ ] The per-test ranked list shows every athlete's personal best for a chosen test, ranked correctly by that test's direction, excluding athletes with no result.
- [ ] The all-tests comparison table shows every athlete's personal best across every test type, with "—" for missing values.
- [ ] An athlete can view their own test history (charts, tables, personal bests) read-only, via their own "Tests" nav link, and cannot log or edit results.
- [ ] The standalone 1RM calculator returns `weight × (1 + reps / 30)` immediately for any typed weight/reps, without saving anything.
- [ ] Tagging an exercise as Squat/Deadlift/Row/Bench Press in the exercise library causes the matching 1RM test's logging flow to offer a suggested value computed from the athlete's logged sets for that exercise, which the coach can accept or override.
