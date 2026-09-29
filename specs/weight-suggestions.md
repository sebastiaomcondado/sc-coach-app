# Weight Suggestions

## Objective
Help an athlete decide what weight to lift for each exercise, instead of guessing or relying on memory. When they open the set-logging screen, the app pre-fills a suggested weight for each set, progressively adjusted from their most recent set of that exact exercise based on how hard that set felt (RPE) relative to what's prescribed today.

## Requirements

### Calculating the suggestion
- The suggestion is based on the athlete's single most recently logged set of that exact exercise — whichever workout it was logged under, regardless of what reps/weight/phase that past set targeted. No averaging or trend analysis across multiple past sets.
- The suggested weight is the previous set's logged weight, adjusted by comparing that previous set's actual RPE against **today's** prescribed RPE for this exercise (the target set for the exercise being logged right now, not whatever was prescribed back when the previous set was logged):
  - Previous RPE **below** today's prescribed RPE → suggest **+5%**.
  - Previous RPE **equal to** today's prescribed RPE → suggest the **same weight** (no change).
  - Previous RPE **above** today's prescribed RPE → suggest **−5%**.
- The suggested value is rounded to the nearest 2.5 (matching typical gym plate increments), e.g. 82.5 × 1.05 = 86.625 → shown as 87.5.

### Where it appears
- The suggestion is pre-filled directly into the Weight input for that set — not a separate hint/button the athlete has to click. They can log it as-is or type over it.
- Applies automatically to every exercise, for every athlete, whenever the necessary data is available. No per-exercise, per-athlete, or per-coach setting to turn it off.

### Multiple sets in one session
- When an athlete logs several sets of the same exercise in one sitting (the existing logging screen lets them fill in all sets before hitting one "Save" for the exercise), each set after the first gets its suggestion computed live from whatever reps/weight/RPE is currently **typed** into the immediately preceding set's row — it does not require that prior set to be saved to the database first.

### Out of scope
- Suggesting reps, RPE, or rest time — only the weight value is suggested.
- Any settings/UI to change the ±5% adjustment size or the 2.5 rounding increment.
- Considering more than the single most recent set (no multi-session averaging, trend lines, or moving averages).
- Showing suggestions or recommendations to the coach — this is an athlete-facing feature only, since only athletes log their own sets.
- Bootstrapping a suggestion from the exercise's prescribed weight when there's no prior logged set — in that case the field simply starts empty, same as today.

## Edge Cases
- When there's no previously logged set at all for that exercise (the athlete's first time ever logging it), the Weight field starts empty — no suggestion.
- When the most recent set for that exercise has no weight logged (e.g. a bodyweight exercise like Chin Up), the Weight field starts empty — no suggestion.
- When the most recent set for that exercise has no RPE logged, the Weight field starts empty — no suggestion.
- When today's exercise has no prescribed RPE set by the coach, the Weight field starts empty regardless of prior history — there's nothing to compare the previous RPE against.
- When the athlete adds a new set row after typing (but not saving) values into the previous row, the new row's suggestion is computed from the previous row's currently-typed weight/RPE, not whatever is already saved in the database for that exercise.
- When the athlete overwrites a pre-filled suggested weight before hitting Save, whatever they typed is what gets logged — same as manual entry today.

## Definition of Done
- [ ] Opening the set-logging screen for an exercise where the athlete has a prior logged set (with weight and RPE) and today's exercise has a prescribed RPE, pre-fills the Weight field with a value adjusted ±5% (or unchanged) based on the RPE comparison, rounded to the nearest 2.5.
- [ ] An exercise with no prior logged sets for that athlete shows an empty Weight field.
- [ ] An exercise whose most recent logged set has no weight, or no RPE, shows an empty Weight field.
- [ ] An exercise with no prescribed RPE set for today shows an empty Weight field, even if prior logged sets exist.
- [ ] Adding a second set within the same logging session, after typing (but not saving) weight/RPE into the first set's row, pre-fills the second set's Weight field based on the first row's currently-typed values.
- [ ] The athlete can overwrite any pre-filled suggested weight before saving, and the overwritten value — not the suggestion — is what gets logged.
- [ ] This behavior applies uniformly to every exercise and every athlete, with no setting anywhere to disable it.
