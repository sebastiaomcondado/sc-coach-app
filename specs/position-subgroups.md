# Position Sub-groups

## Objective
Rename the existing Position field's options to a rugby-specific list, make picking one required, and use it to sub-divide athletes by position within the "Forwards" and "Backs" squad groups on the roster page — so a coach can see their team laid out the way a real team sheet would be.

## Requirements

### Position field
- The existing Position field's options are replaced with: Prop, Hooker, Lock, Flankers, 8, Scrum Half, Fly Half, Center, Winger, Fullback (10 options, no blank/"—" default).
- Existing athlete data is migrated 1:1 to the new labels: Flanker → Flankers, Number 8 → 8, Scrum-half → Scrum Half, Fly-half → Fly Half, Centre → Center, Wing → Winger; Prop, Hooker, Lock, and Fullback are unchanged.
- Position becomes required: the profile form (both the athlete's own self-edit and the coach's edit of an athlete) blocks saving until a position is selected. Both roles keep the ability to edit it, unchanged from today.
- Out of scope: the signup/join flow isn't changed — a new athlete can still finish signing up without a position; they're covered by the same missing-position banner as any other athlete without one (see below).

### Roster sub-grouping
- On the coach's roster page, within a group heading whose name is exactly "Forwards", athletes are further sub-divided into 5 position sub-headings, in this fixed order: Prop, Hooker, Lock, Flankers, 8.
- Within a group heading whose name is exactly "Backs", athletes are sub-divided into 5 position sub-headings, in this fixed order: Scrum Half, Fly Half, Center, Winger, Fullback.
- An athlete in "Forwards" or "Backs" whose position doesn't belong to that group's 5 (or who has no position at all) appears under one additional "No position" sub-heading, shown last.
- Any other group — a custom-named one, or "Unassigned" — is unaffected and lists athletes flat, exactly as it does today.

### Missing-position reminder
- An athlete with no position set sees a dismissible-free reminder banner (same visual pattern as the existing weekly weigh-in banner — not a "Got it" dismiss, just present whenever the condition is true) prompting them to set one, linking to their profile edit page.
- The banner disappears on its own once the athlete has a position set — no separate dismiss action, matching how the weigh-in banner behaves.

### Out of scope
- Sub-grouping by position on the Groups management screen — this only applies to the roster page.
- Any coach-facing flag for missing positions beyond the "No position" sub-heading on the roster itself.
- Requiring a position during signup/join.
- Any change to who can edit Position (both athlete and coach already could, and still can).

## Edge Cases
- When an existing athlete's old position value doesn't have logged data migrated (shouldn't happen given the 1:1 mapping, but if a profile somehow has a value outside the old list), it's treated the same as no position: shows under "No position" and the athlete sees the reminder banner.
- When a "Forwards" or "Backs" group has zero athletes in a given position, that position's sub-heading simply doesn't render (no empty section shown) — consistent with how the app already skips empty groupings elsewhere.
- When a group is renamed to or from exactly "Forwards" or "Backs", its roster display switches between sub-grouped and flat accordingly on the next page load — no special migration needed since this is computed live from the group's current name.
- When an athlete sets their position, the missing-position banner stops showing for them on their very next page load, without needing an explicit dismiss.

## Definition of Done
- [ ] The Position dropdown (self-edit and coach-edit) offers exactly the 10 new options, none blank, and requires a selection before the form can be saved.
- [ ] Existing athletes' position values are migrated to the new labels per the confirmed 1:1 mapping.
- [ ] On the roster page, a group named exactly "Forwards" shows its athletes under 5 position sub-headings in the fixed order (Prop, Hooker, Lock, Flankers, 8).
- [ ] A group named exactly "Backs" shows its athletes under 5 position sub-headings in the fixed order (Scrum Half, Fly Half, Center, Winger, Fullback).
- [ ] Any athlete in either group with no position, or a position from the other group, appears under a trailing "No position" sub-heading.
- [ ] Any other group (custom name or "Unassigned") still lists athletes flat, unchanged from today.
- [ ] An athlete with no position sees a persistent reminder banner (matching the weigh-in banner's style) linking to their profile, which disappears once they set one.
