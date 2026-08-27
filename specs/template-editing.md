# Template Editing

## Objective
Let a coach edit a template's exercises and phases after it's been created, instead of only being able to change its name, notes, cycle, and day-of-week. Editing should give the coach the same authoring power they have when first building a template.

## Requirements

### Editing exercises and phases
- A coach can add new exercises to an existing template.
- A coach can remove an exercise from an existing template; removing it also removes its phases (no orphaned phases left behind).
- A coach can reorder exercises via drag-and-drop.
- A coach can edit an existing exercise's section, superset group, weight, and notes.
- A coach can add, edit, and remove phases (label, sets, reps, RPE, rest, start/end week) for any exercise on the template.
- Saving a template with zero exercises left is blocked, the same way creation already requires at least one exercise.
- Phases within a single exercise are not reorderable — they stay in the order they were added, same as today.

### Scope relative to existing workouts
- Editing a template's exercises/phases only affects workouts assigned from it **after** the edit. Any workout already created from that template before the edit is completely unaffected — its own copied exercise data doesn't change.

### Unaffected functionality
- The existing ability to edit a template's name, notes, cycle link, and day-of-week keeps working exactly as it does today — this feature only adds exercise/phase editing on top of it.

### Out of scope
- Version history of template changes (no audit trail of what changed and when).
- "Duplicate as new template" — this is in-place editing only, not a cloning/save-as flow.
- Reordering phases within an exercise (only the exercises themselves are reorderable).

## Edge Cases
- When a coach tries to save a template with zero exercises remaining, the save is blocked with a clear message.
- When a coach removes an exercise that has phases, those phases are removed along with it — no leftover/orphaned phase rows.
- When a coach edits a template's exercises/phases, workouts already assigned from that template before the edit are unaffected — only future assignments reflect the change.

## Definition of Done
- [ ] A coach can add new exercises to an existing template.
- [ ] A coach can remove an exercise from an existing template (its phases go with it).
- [ ] A coach can reorder exercises via drag-and-drop.
- [ ] A coach can edit an exercise's section, superset group, weight, and notes.
- [ ] A coach can add, edit, and remove phases (label, sets, reps, RPE, rest, start/end week) for any exercise.
- [ ] Saving with zero exercises left is blocked, same as template creation.
- [ ] Editing a template's exercises/phases never changes a workout already assigned from it before the edit.
- [ ] The existing name/notes/cycle/day-of-week editing keeps working as it does today.
