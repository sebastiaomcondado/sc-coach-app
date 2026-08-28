# Leaderboards

## Objective
Gamify the app for both the coach and athletes: leaderboards ranking athletes by workout consistency and strength progress, a live monthly podium, and permanent achievement badges — to motivate athletes and give the coach visibility into who's engaged and improving.

## Requirements

### Completed workout (shared definition)
- A workout counts as **completed** when every one of its prescribed exercises has at least one logged set from that athlete.
- This exact definition is used consistently for the workouts leaderboard, the podium, and the workout-count badges.

### Leaderboards page
- New "Leaderboards" nav link, visible to both coach and athletes.
- Page sections, top to bottom: the monthly podium, the Workouts Completed leaderboard, the Strength Gained leaderboard.
- A group filter (All / one of the coach's squad groups) applies to both leaderboards but **not** the podium, which always covers the full roster.
- Visible to both roles with the same content (not scoped to "my own data" for athletes).

### Workouts Completed leaderboard
- Two views: **all-time total** and **current calendar month** — both available on the page (e.g. as a toggle/tabs).
- Ranked descending by completed-workout count.
- Every athlete in the current group filter appears, including those with 0 completed workouts.

### Strength Gained leaderboard
- Considers only the four exercises tagged squat/deadlift/row/bench-press via the existing `one_rm_category` exercise tagging (built for the Tests page).
- For each of the four categories, per athlete: gain = heaviest weight ever logged in a set for a tagged exercise in that category − the earliest weight ever logged for it. An athlete with only one logged set in a category has a gain of 0 for it.
- An athlete's total score = sum of the four categories' gains, in kg.
- All-time only — no monthly view for this leaderboard.
- Ranked descending by total kg gained; every athlete in the current group filter appears, including those with 0.

### Monthly podium
- Shows the top 3 athletes by workouts completed in the current calendar month.
- Only athletes with at least 1 completed workout this month are eligible — if fewer than 3 qualify, fewer are shown (down to an empty state if none qualify yet).
- Always covers the full roster, regardless of the group filter set for the leaderboards below it.
- Live standings only: recalculated fresh on every page view. No end-of-month freeze, no history of past months.

### Badges
- Fixed milestones, identical for every coach (not coach-configurable):
  - Workout-count badges at 25, 50, 100, and 200 completed workouts (using the shared completed-workout definition above).
  - A weight badge for logging a single set of 100kg or more, on any exercise (not limited to the four tagged 1RM categories).
- Once earned, a badge is **permanent** — it is never removed, even if later changes to the underlying data (e.g. a deleted workout) would drop the athlete back below the threshold.
- Badge-earning is checked **immediately after an athlete logs a set** — not on a schedule and not lazily on page load. Right after a set is saved, the app checks whether that action caused the athlete to newly cross any badge threshold.
- Badges are displayed in two places, visible to the coach and to any athlete (not privacy-scoped to just the athlete who earned them):
  - Next to each athlete's entry on the Leaderboards page.
  - On the athlete's profile page (both the coach's view of it and the athlete's own).

### Last month's podium badge
- Separately from the permanent milestone badges, an athlete who finished in the top 3 for workouts-completed in the **most recently completed calendar month** carries a badge for that placement (gold/silver/bronze, distinct per position) through the current month — the same motivating idea as the live podium, just looking one month back.
- Computed live, not stored as a snapshot: at any point during the current month, this is simply the same "most workouts completed" ranking re-run for last calendar month's date range instead of this month's. Since last month is over and its data doesn't change, this is stable for the rest of the current month.
- Because it's recomputed from last month every time, this badge is **not permanent** like the milestone badges — an athlete only carries it into the *next* month if they place top 3 again during the current one. This is what creates the "keep working or lose it" effect.
- Displayed in the same two places as milestone badges (Leaderboards page entry, profile page), visible to the coach and any athlete.

### Athlete notification
- When an athlete earns one or more new milestone badges, they see a dismissible in-app banner the next time they're in the app, listing the newly earned badge(s) — same visual pattern as the existing group-change banner (explicit "Got it" button, doesn't auto-dismiss).
- The same banner treatment applies when a new calendar month begins and the athlete newly qualifies for a last-month's-podium badge (gold/silver/bronze) — shown once the first time they're in the app that month, dismissible the same way, not repeated for the rest of that month.
- If a set logged crosses multiple milestone thresholds at once, all newly earned badges appear together in one banner.
- Dismissing marks that specific notification seen; an already-seen milestone badge never re-notifies, and an already-seen "last month's podium" notice doesn't re-notify again until it next changes (i.e. the following month).

### Out of scope
- Notifications about leaderboard rank changes — only badge-earning (milestone or last-month's-podium) triggers a notification.
- Any points/currency system beyond the fixed badges.
- Coach-configurable badge thresholds — the milestone list is fixed.
- A browsable history of past months' podiums beyond the single most-recent-month badge described above — no dedicated history page, no freezing/archiving of every past month.
- Group filtering on the podium (it's always roster-wide).

## Edge Cases
- When fewer than 3 athletes have completed a workout this month, the podium shows only those who qualify (1, 2, or an empty state) rather than padding with 0-count athletes.
- When an athlete has 0 completed workouts or 0 kg strength gain, they still appear on the relevant leaderboard with a 0 — but never on the podium, which requires at least 1 completed workout this month.
- When a logged set crosses multiple badge thresholds at once (e.g. hitting 100 workouts and a 100kg lift in the same log action), all newly earned badges are recorded and shown together in a single notification banner.
- When a badge has already been earned, further activity never re-triggers or re-notifies for that same badge.
- When the group filter is set to a specific group, an athlete with no group ("Unassigned") does not appear under it — they only appear under "All".
- When an athlete has only one logged set for a tagged 1RM category, their strength gain for that category is 0 (heaviest and earliest are the same set).
- When it's the app's first calendar month in use (or an athlete joined this month), there is no "last month" data yet, so no one shows a last-month's-podium badge.
- When an athlete placed top 3 last month but does not place top 3 this month, their last-month's-podium badge is gone as soon as the next month begins (it reflects only the most recently completed month).
- When an athlete places top 3 again in consecutive months, they get a fresh notification banner each time a new month starts and they still qualify, even though the badge type is the same.

## Definition of Done
- [ ] A "Leaderboards" nav link is visible to both coach and athlete roles, and the page shows the same content for both.
- [ ] The podium shows the top 3 athletes by workouts completed this month, only among athletes with at least 1 completed workout; shows fewer than 3 (or an empty state) when fewer qualify; is unaffected by the group filter.
- [ ] The Workouts Completed leaderboard has both an all-time and a current-month view, ranked descending, with every athlete in the current filter shown (including 0s).
- [ ] The Strength Gained leaderboard sums heaviest-minus-earliest kg across the four tagged 1RM categories per athlete, ranked descending, with every athlete in the current filter shown (including 0s).
- [ ] A group filter control scopes both leaderboards (not the podium) to a specific squad group or "All".
- [ ] An athlete who logs a set that crosses the 25/50/100/200 completed-workout thresholds, or logs 100kg+ in a single set, is immediately awarded the corresponding badge(s).
- [ ] Earned milestone badges are permanent and appear both on the Leaderboards page next to the athlete's entry and on their profile page, visible to the coach and any athlete.
- [ ] An athlete who placed top 3 in the most recently completed calendar month shows a gold/silver/bronze badge (matching their placement) in the same two locations, and it disappears at the start of the following month unless they place top 3 again.
- [ ] An athlete who earns a new milestone badge, or newly qualifies for a last-month's-podium badge, sees a dismissible "Got it" banner listing it next time they're in the app, and it never reappears once dismissed until it would next change.
