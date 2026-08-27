# S&C Coach

## Objective
A training-management web app for a Strength & Conditioning coach running a rugby squad (Grupo Desportivo Direito). The coach plans and assigns structured, progressive training; athletes log what they actually did; the coach tracks completion and progress over time — with the whole thing easy for a non-technical coach to both use and build workouts in, and with minimal manual per-athlete admin.

## Requirements

### Auth and accounts
- Two roles: coach and athlete.
- A coach signs up directly (name, email, password) via a signup page.
- Athletes never self-register from scratch — they join only via a link a coach generates:
  - A one-time link for a named person, or
  - One reusable link for the whole squad (e.g. pasted into a WhatsApp group).
- Joining requires: full name, email, password, a group, and a photo.
  - Group and photo are both mandatory — the photo is collected as a required second step immediately after account creation, before the athlete reaches their profile.
- Forgotten passwords are self-service: a "Forgot password" flow sends a reset email; no coach intervention needed.

### Roster and groups
- The coach's roster page lists every linked athlete, grouped into sections by their group value (e.g. "Forwards," "Backs"), with an "Unassigned" section for anyone without one.
- A coach can open any athlete's profile to view/edit: full name, date of birth, position, height, weight, jersey number, group, and photo.
- "Group" is a free-text field (not a fixed list) with autocomplete suggestions — defaults to "Forwards"/"Backs," plus whatever group names already exist on the coach's roster.
- There is no dedicated "manage groups" screen — a group exists only as a value athletes are tagged with.

### Exercise library
- The coach maintains a shared library of exercises: name, category, optional video URL.
- New exercises can be created ad hoc while building or importing a template, matched by name against existing ones to avoid duplicates.

### Program templates
- A template is a reusable named workout: optional notes, optional link to a cycle, optional day-of-week.
- Each template has a list of exercises, each with: a section label (e.g. "Warm Up"), an optional superset group letter, an optional fixed weight, and notes.
- Each exercise can have one or more phases: a free-text label (e.g. "Week 1-3"), sets, reps, RPE, rest, and optional start/end week numbers used for auto-scheduling.
- Templates can be built by hand, or bulk-imported from a public Google Sheet — parsed into exercises + phases, auto-creating any exercises that don't already exist (matched by name).
- After creation, only a template's name, notes, cycle link, and day-of-week can be edited. Its exercises and phases cannot be edited — a new template must be created (or an import re-run) to change them.
- A template's page offers editing those fields, or jumping straight into the workout builder with the template's exercises pre-filled, ready to assign.

### Training cycles
- A cycle is a named training block (e.g. "Block 1") with optional start/end dates and notes, grouping a set of templates.
- A cycle's page lists its templates, lets the coach edit the cycle's own fields, and create a new template already linked to it.
- Each template within a cycle has its own "Assign" link, for manually assigning just that template to any athlete(s) on any date.
- **Assign cycle to a group**: picking a group and confirming auto-schedules every template in the cycle that has a day-of-week set, onto every matching date across the cycle's date range, for every athlete in that group — resolving each exercise's correct phase by week number.
  - Requires the cycle to have both a start and end date.
  - Requires at least one athlete in the chosen group.
  - Templates without a day-of-week are skipped and listed back to the coach.

### Assigning and logging workouts
- The workout builder lets a coach select one or more athletes at once, set a title/date/notes, optionally start from a template (pre-filling exercises, with a choice of which phase applies per exercise), and optionally tag the workout with a cycle. Submitting creates one workout per selected athlete.
- Athletes see their own workouts on their home page, split into Upcoming/Past, each marked Logged or Not logged.
- Opening a workout lets the athlete log actual sets — reps, weight, RPE, notes — per exercise.
- Both coach and athlete have a month calendar view of scheduled workouts.
- The coach's calendar, and an athlete's workout list on their profile page, can be filtered by cycle.

### Progress tracking and body metrics
- A coach viewing an athlete sees: personal records (heaviest weight ever logged per exercise), a progress chart (weight over time per exercise), and a body metrics chart (bodyweight/sleep/readiness over time).
- Athletes have their own "My progress" view of the same kind of data.
- Athletes have a "Body metrics" page to log bodyweight, sleep hours, readiness (1–10), and notes for any date — one entry per date; logging again for the same date overwrites it.
- A banner appears on every athlete page ("Log your weight for this week — do it now") until they've logged a bodyweight entry since the most recent Monday, then disappears.

### Installability
- The app is installable to a phone's home screen (Add to Home Screen / standalone display) via a web manifest, icon set, and a registered service worker.
- The service worker exists only so browsers recognize the app as installable — it deliberately does no offline caching, since the app's data (rosters, workouts, logging) is inherently live and online-only.

### Reports
- An in-app "Reports" page (no email delivery — the coach checks it themselves).
- **Weekly section**: for a selected week (defaults to current, Prev/Next navigation), shows each athlete's workouts scheduled vs. completed that week, with a completion percentage.
- **Monthly section**: for a selected month (defaults to current, Prev/Next navigation), shows each athlete, per exercise, the first-vs-last logged weight and reps within that month — only exercises with at least two different logged days that month appear.

### Out of scope
- Coach/athlete messaging or chat.
- Automatic email delivery of reports (the in-app Reports page was chosen instead).
- Multiple coaches collaborating on the same athlete roster (the schema allows it, but no UI supports it).
- A fixed (non-free-text) list of groups, and a dedicated "manage groups" screen — noted as a future build item, not part of this spec.
- Editing a template's exercises/phases after creation — noted as a future build item, not part of this spec.

## Edge Cases
- When an invite link is invalid, expired, or already used, the join page shows "Link not valid" and tells the person to ask their coach for a new one.
- When someone tries to complete signup without picking a group, it's blocked both in the browser and by the server.
- When someone reaches the end of signup without providing a photo, it's blocked with an inline error — the account exists but they can't proceed past the photo step without one.
- When a coach tries to auto-assign a cycle that has no start or end date, it's blocked with a message to add dates first.
- When a coach tries to auto-assign a cycle to a group with no athletes in it, it's blocked with "No athletes in that group."
- When a coach tries to auto-assign a cycle where none of its templates have a day-of-week set, it's blocked, and the specific templates needing one are listed back.
- When cycle auto-assignment fails partway through, the response reports how many workouts were already created before the failure, so the coach knows the partial state.
- When an athlete has no group set, they appear under "Unassigned" on the roster rather than being hidden or causing an error.
- When a password-reset link is invalid or expired, the reset page shows a message pointing back to request a new one.
- When a selected week or month in Reports has no data, it shows 0/0 (no percentage, avoiding divide-by-zero) or "not enough logged sets," rather than crashing or rendering blank.
- When a coach has no athletes, templates, or cycles yet, each relevant page shows a helpful empty-state message with a call to action instead of a blank page.

## Definition of Done
- [ ] A coach can sign up, log in, and reach their roster.
- [ ] A coach can generate a per-athlete invite link or a reusable team link.
- [ ] Opening an invite link lets someone create an athlete account, which requires picking a group and uploading a photo before landing on their profile.
- [ ] The coach's roster shows athletes grouped by their group, including an "Unassigned" section.
- [ ] A coach can add exercises to a shared library, with an optional video link.
- [ ] A coach can build a template by hand (exercises, sections, supersets, multi-week phases) or import one from a Google Sheet.
- [ ] A coach can create a cycle and link templates to it.
- [ ] A coach can auto-assign a whole cycle to a group in one click, and the resulting workouts land on the correct dates with the correct week's phase applied.
- [ ] A coach can manually assign a single template (or a from-scratch workout) to one or more athletes on a specific date.
- [ ] An athlete can see their upcoming/past workouts and log actual sets against one.
- [ ] An athlete can log bodyweight/sleep/readiness, and sees a nag banner until they've logged weight for the current week.
- [ ] A coach can view an athlete's personal records and progress charts.
- [ ] A coach can view the Reports page and see weekly completion and monthly weight/rep evolution per athlete, navigable by week/month.
- [ ] A user who forgets their password can reset it via email without coach intervention.
- [ ] The app can be installed to a phone's home screen and opens in standalone display.
- [ ] All of the above work correctly on both desktop and mobile-width screens.
