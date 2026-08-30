# Google Sheets Template Import — Preview Step

## Objective
Add a preview/confirm step to the existing Google Sheets template import, so a coach can see exactly what will be created — and what's being skipped, and why — before anything is saved, instead of the current import-immediately-on-submit behavior.

## Requirements

### What's already built (unchanged by this spec)
- The existing "Import from Google Sheets" entry point on the Templates page, and the form fields (Template name, Google Sheets link, Tab name, Cycle, Notes) stay as they are.
- The sheet-reading mechanism stays as-is: no Google OAuth, no Google Cloud project — the sheet must be shared as "anyone with the link can view," and the app reads it via Google's public CSV-export endpoint.
- The column format stays exactly as documented in the existing UI: Section, Group, Exercise, Video, Category, Phase, Sets, Reps, RPE, Rest, Notes — with blank Section/Group/Exercise/Video/Category cells filling down from the row above (merged-cell friendly), matching `src/lib/sheetImport.ts`'s current behavior.
- Auto-creating an exercise when its name doesn't match the library (using the Video/Category columns for the new exercise) stays as-is.

### New: preview before saving
- Submitting the form no longer imports immediately. Instead, it fetches and parses the sheet and shows a preview screen, with nothing written to the database yet.
- The preview shows:
  - Every exercise that will be created, with its section, superset group, and phase(s) (label, sets, reps, RPE, rest).
  - A separate, clearly distinct list of flagged/skipped rows — any row the parser can't attach to an exercise (i.e., no exercise name available for that row, even after fill-down) — each with its row number and the reason.
- A "Confirm import" button on the preview screen is the only thing that actually saves the template, its exercises, and its phases (and creates any new exercises). It is disabled when there are zero parsed exercises to import.
- A "Back" control returns to the form without losing what was entered (template name, sheet URL, tab name, cycle, notes), so the coach can fix the sheet or the tab name and re-preview.
- The preview reuses the exact entries already parsed for the preview when the coach confirms — it does not re-fetch or re-parse the sheet a second time on confirm.

### Out of scope
- Any change to how the sheet is read (still CSV-export via a public link, not OAuth/Drive API).
- Any change to the column format or fill-down behavior.
- Google account connection/disconnection, Google's file picker, or tab auto-discovery — the coach still types the tab name manually.
- Re-importing the same sheet updating a previously-created template — every confirmed import still creates a new, separate template.
- Flagging or validating anything beyond "no exercise name available for this row" (e.g. this pass does not newly require Sets/Reps to be present — that already silently produces a phase with blank values today, and that behavior is unchanged).

## Edge Cases
- When the sheet or tab can't be read (bad URL, wrong tab name, not shared publicly), the existing error message is shown at the form step — no preview is generated.
- When every row in the tab is unattachable to an exercise (nothing parses), the preview shows zero exercises and "Confirm import" is disabled, with the flagged list showing why each row was skipped.
- When the coach uses "Back" after seeing a preview, the form still has their previously entered template name, sheet URL, tab name, cycle, and notes.
- When "Confirm import" succeeds, the result screen (import summary + "View templates" / "Import another") stays exactly as it is today.

## Definition of Done
- [ ] Submitting the import form fetches and parses the sheet and shows a preview screen instead of saving immediately.
- [ ] The preview lists every exercise (with section, superset, phases) that would be created.
- [ ] The preview lists flagged/skipped rows separately, each with its row number and reason.
- [ ] "Confirm import" is disabled when there are zero parsed exercises, and otherwise creates the template/exercises/phases (and any new exercises) using exactly the entries already shown in the preview, with no second fetch of the sheet.
- [ ] A "Back" control returns to the form with all previously entered values intact.
- [ ] The column format, fill-down behavior, CSV-export reading mechanism, and auto-exercise-creation all continue to work exactly as they do today.
