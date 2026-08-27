# Group Management

## Objective
Replace the current free-text "group" field with a real, coach-managed list of groups (starting with Forwards/Backs), and add a dedicated screen where a coach can manage those groups and move athletes between them — plus, on the same pass, let a coach permanently delete an athlete (one at a time or in bulk) from that screen.

## Requirements

### Groups become a managed list
- Groups are a coach-owned, named list (not free text) — each coach manages their own set.
- A coach can **create** a new group (name only).
- A coach can **rename** an existing group; the new name applies everywhere that group is referenced.
- A coach can **delete** a group. Any athletes currently in that group become "Unassigned" — deletion is never blocked by group membership.
- Creating or renaming a group to a name that already exists for that coach is blocked, with a clear message (e.g. "Backs already exists").
- Groups are listed in alphabetical order wherever they appear.
- One group per athlete (no multi-group membership).
- No group-level roles/permissions, and no merging two groups into one.
- Assumption: a coach who has no groups yet gets "Forwards" and "Backs" auto-created, so the management screen isn't empty on day one.
- Migration: any existing free-text group values already set on athletes are converted into real groups (matched by name) when this ships — nothing is wiped.

### Group management screen
- New coach-only screen listing all of the coach's groups and their members.
- Create / rename / delete a group from this screen.
- Each athlete row has a dropdown to move them to a different group.
- Athletes can be multi-selected on this screen and **bulk-deleted** in one action.

### Athlete deletion
- Deleting an athlete (single, from their own profile page, or bulk, from the group management screen) **permanently removes their account and all their data** — profile, workouts, logged sets, body metrics. This cannot be undone.
- Requires an explicit yes/no confirmation dialog before it happens, whether deleting one athlete or several at once.
- After deletion, the coach sees an immediate on-screen confirmation (e.g. "Athlete deleted" / "3 athletes deleted").

### Group assignment going forward
- At signup, an athlete picks their group from the managed list (a dropdown), not free text.
- After signup, only a coach can change an athlete's group — the "Group" field is removed from an athlete's own self-edit profile view.
- The "Group" field still appears when a **coach** edits an athlete's profile (as a dropdown of the coach's managed groups), as a convenience alongside the dedicated management screen.

### Notifying the athlete
- When a coach changes an athlete's group, that athlete sees a dismissible in-app banner about it (styled like the existing weekly weigh-in banner) the next time they're in the app.
- The banner requires an explicit "Got it" button to dismiss — it doesn't disappear on its own.
- If an athlete's group changes more than once before they see the banner, they see one banner reflecting only the latest group — not one per change.
- Deletion does not notify the athlete (their account no longer exists to show it to) — only the coach's immediate on-screen confirmation applies there.

### Out of scope
- Multiple groups per athlete.
- Group-level roles or permissions.
- Custom group ordering (alphabetical only).
- Merging two groups into one.
- Emailing the athlete or coach about a group change or deletion (in-app only, no email infrastructure involved).
- Any "undo" or recovery path for a deleted athlete.

## Edge Cases
- When a coach tries to create or rename a group to a name that already exists, the action is blocked with a clear message.
- When a coach deletes a group that still has athletes in it, those athletes become "Unassigned" rather than the deletion being blocked.
- When a coach deletes an athlete (single or bulk), a yes/no confirmation is required before anything happens.
- When an athlete's group changes more than once before they've seen a notice, they see a single banner for the latest group only.
- When an athlete has never seen a group-change banner and their group hasn't changed, no banner appears.
- When a coach has zero groups (new account), "Forwards" and "Backs" are auto-created so the management screen has content.

## Definition of Done
- [ ] A coach can create, rename, and delete groups from the group management screen; deleting one moves its members to Unassigned.
- [ ] Creating or renaming a group to a name that already exists is blocked with a clear message.
- [ ] A coach can move an athlete to a different group via a dropdown next to their name on the group management screen.
- [ ] A coach can select multiple athletes on that screen and delete them all at once.
- [ ] Deleting an athlete (single, from their profile page, or bulk, from the management screen) requires a yes/no confirmation first.
- [ ] Deleting an athlete permanently removes their account and all their data (workouts, logged sets, body metrics).
- [ ] The coach sees an immediate on-screen confirmation after deleting.
- [ ] New athletes pick their group from the managed list at signup — no free-text entry.
- [ ] An athlete can no longer change their own group from their profile; a coach still can, via a dropdown on the athlete's profile edit page.
- [ ] When a coach changes an athlete's group, that athlete sees a dismissible banner (with an explicit "Got it" button) next time they're in the app, reflecting only their latest group.
- [ ] Existing free-text group values already on athletes are preserved as real groups when this ships.
