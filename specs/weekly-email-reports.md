# Weekly Email Reports

## Objective
Deliver the coach's weekly training report by email in addition to the existing in-app Reports page, so the coach gets a recap without having to open the app — automatically every week, plus on demand.

## Requirements

### Email content
- Same two sections the in-app Reports page already shows, for the relevant week/month:
  - **Weekly completion**: per athlete, workouts completed vs. scheduled that week, with the percentage (same numbers as the "Workouts completed — week of X" section).
  - **Monthly evolution**: per athlete, per exercise, first-vs-last logged weight/reps for the month the week falls in (same numbers as the "Evolution" section).
- Formatted as simple HTML (headings, a list per athlete) — not plain text, not a heavy template system.
- Reuses the existing report-calculation logic (`src/lib/reports.ts`) rather than recomputing the numbers a different way.

### Automatic weekly send
- Sent every Sunday at 5:00 PM Portugal time, via a Vercel Cron job calling a dedicated API route.
- Covers the week that is wrapping up that same day (Monday through Sunday of the current week) — not the prior week.
- Sends even when there's nothing to report (e.g. no athletes, or none had anything scheduled) — the email still goes out with a "nothing to report this week" message, confirming the automation ran.
- Recipient is a single, hardcoded email address stored in an environment variable (not committed in source) — this app has one coach today; if more coaches are added later, extending this to send each coach their own report is future work, not part of this build.

### Manual send
- A "Email me this report" button on the existing Reports page, next to the week/month it's currently displaying.
- Sends immediately, covering whatever week and month are currently shown on the page (respecting the existing week/month navigation).
- Shows a simple success or error message after sending; no confirmation dialog (non-destructive action).

### Sending infrastructure
- Uses Resend as the email-sending service.
- No custom domain is verified — sends from Resend's shared test/onboarding domain, which only reliably delivers to the email address the Resend account itself was created with. Since the one hardcoded recipient is that same address, this works for the current single-coach scope.
- The cron API route is protected the standard Vercel way (checks the `CRON_SECRET` Vercel automatically sends), so it can't be triggered by an arbitrary outside request.

### Out of scope
- Emailing every coach automatically if the app gains more coaches — only the one hardcoded recipient, for now.
- Any email preferences UI (frequency, unsubscribe, choosing which sections to include).
- CC'ing or sending to multiple recipients.
- Any report content beyond what the in-app Reports page already shows (weekly completion + monthly evolution).
- Retrying a failed send automatically — a failure is just logged/visible in Vercel's function logs for that run.
- Verifying a custom sending domain (can be revisited later if delivery needs to reach other coaches).

## Edge Cases
- When there are no athletes on the roster, or none had anything scheduled that week, the automatic email still sends with a "nothing to report this week" message rather than being skipped.
- When Resend fails to send (bad API key, service error, etc.), the API route returns a non-200 response and the error is visible in Vercel's logs for that run — no retry, no other notification.
- When the coach clicks "Email me this report" while viewing a past week/month (via the existing navigation), the email covers that displayed week/month, not necessarily the current one.
- When the manual send succeeds or fails, the coach sees an inline success or error message on the Reports page — nothing silent.
- When the cron route is hit without the correct Vercel cron authorization, it's rejected rather than sending an email.

## Definition of Done
- [ ] A Vercel Cron job is configured to call a dedicated API route every Sunday at 5:00 PM Portugal time.
- [ ] That route computes the current week's completion and current month's evolution (via the existing `src/lib/reports.ts` logic) and emails it via Resend, in simple HTML, to the hardcoded recipient address from an environment variable.
- [ ] The route sends a "nothing to report" email rather than skipping when there's no roster/no scheduled workouts.
- [ ] The route rejects requests that don't carry Vercel's own cron authorization.
- [ ] The Reports page has an "Email me this report" button that sends the currently-displayed week/month's data on click and shows a success or error message.
- [ ] Triggering the manual send while viewing a different (non-current) week/month via the existing navigation emails that week/month's data, not the current one.
