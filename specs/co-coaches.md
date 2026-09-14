# Co-Coaches

## Objective
Let a coach invite another person to help run the same team — sharing the exact same roster, workouts, templates, and everything else — instead of that person getting their own separate, empty coach account. The inviting coach becomes the team's **owner**; anyone they invite becomes an **assistant** with day-to-day access but not full control.

## Requirements

### Team model
- Every coach is the owner of their own team from the moment their account exists — this applies retroactively to existing coach accounts with no migration needed, since a solo coach is simply a team of one.
- A team can have any number of assistant coaches.
- Everything currently scoped to "the coach" — roster, squad groups, workouts, templates, cycles, exercises tagging, tests, leaderboards/badges, reports — is shared across the whole team: the owner and every assistant see and act on the exact same data, not separate copies.
- Content created by an assistant (a workout, a template, a logged test, etc.) is immediately visible to the owner and every other assistant, exactly as if the owner had created it themselves.

### Assistant permissions
- An assistant coach can do everything a solo coach can today **except**:
  - Deleting an athlete (single or bulk).
  - Inviting a new co-coach, or removing an existing one.
  - Creating, renaming, or deleting a squad group (moving an athlete between *existing* groups is still allowed).
- Everything else — building/assigning/logging workouts, creating/editing templates and cycles, managing the exercise library, logging tests, viewing leaderboards, viewing/sending reports, importing from Google Sheets, editing an athlete's profile (except deleting them) — is fully available to an assistant, identical to the owner.

### Inviting a co-coach
- A new "Coaches" nav link/page, visible to both the owner and assistants.
- The owner sees the current team list (themselves plus any assistants) and can generate a single-use invite link for a new co-coach, and remove an existing assistant's access.
- An assistant sees the same team list (read-only) but has no invite or remove controls.
- The invite link, when opened, lets the invited person create their own new account (name, email, password) — same pattern as an athlete accepting an invite — and they land as an assistant on the inviting coach's team immediately, with no separate "join" step afterward.
- The invite link is single-use: once someone signs up through it, it can't be used again.
- If the email used at signup already belongs to an existing account (coach or athlete), the invite is rejected with a clear error, same as any other signup with a taken email.

### Removing a co-coach
- The owner can remove an assistant from the "Coaches" page.
- Removing an assistant **permanently deletes their account entirely** (same behavior as deleting an athlete) — they don't become a "coach with no team," their account and login stop existing.

### Out of scope
- An existing coach account (with its own separate roster) merging into another coach's team — the invite flow only creates brand-new accounts.
- An assistant inviting or removing other coaches, under any circumstance.
- Per-assistant custom permissions (e.g. one assistant more restricted than another) — the owner/assistant split is fixed and the same for every assistant.
- Any limit on the number of assistants a team can have.
- Any change to what athletes themselves can see or do.

## Edge Cases
- When an assistant tries to delete an athlete, invite/remove a coach, or create/rename/delete a squad group, the action is blocked — those controls simply aren't available to them in the UI, and the underlying request is rejected if attempted directly.
- When someone signs up through a co-coach invite link using an email that's already registered, the signup is rejected with a clear "already registered" error and the invite link remains unused (still valid for a different email).
- When the owner removes an assistant, that assistant's account and login are deleted immediately — any content they created (workouts, templates, etc.) stays with the team, unaffected.
- When a solo coach (no assistants yet) opens the "Coaches" page, they see just themselves listed, with the invite option available.

## Definition of Done
- [ ] A "Coaches" page is reachable from the nav for both owner and assistant roles.
- [ ] The owner can generate a single-use invite link from that page; opening it lets a new person sign up and land as an assistant on the owner's team immediately.
- [ ] The owner sees the full team list with a way to remove any assistant; an assistant sees the same list with no invite/remove controls.
- [ ] Removing an assistant permanently deletes that assistant's account.
- [ ] An assistant can build/assign/log workouts, manage templates/cycles/exercises/tests, view leaderboards, and view/send reports — identical to the owner.
- [ ] An assistant cannot delete an athlete, invite/remove a coach, or create/rename/delete a squad group — these controls are unavailable to them and blocked if attempted directly.
- [ ] A workout, template, or other item created by an assistant is immediately visible to the owner (and vice versa) — there is one shared roster and dataset per team, not separate ones.
- [ ] Signing up through a co-coach invite with an already-registered email is rejected with a clear error, and the link still works for a different email afterward.
