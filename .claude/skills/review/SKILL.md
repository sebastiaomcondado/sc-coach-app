---
name: review
description: Compare the current build against its spec file under specs/, requirement by requirement, and report every gap, bug, or missing piece by name. Use this whenever the user runs /review, or asks to "check this against the spec," "is this done," or "did we meet the spec" for a feature that has a spec file. Only declare the build passing when every checkable item in the spec (Requirements, Edge Cases, and Definition of Done) is confirmed met through actual verification, not by reading code and assuming. Do not fix anything during this skill — it produces a findings report with concrete fixes for a build pass to act on.
---

# Review

Audit the current build against its spec, one requirement at a time, and report exactly what's missing or broken — precisely enough that a build pass could fix every item without asking a follow-up question. This skill never edits code. It only investigates and reports.

## 1. Find the spec

- If the user named a spec (`/review <name>`, or mentioned a feature), use `specs/<name>.md` (try the exact name, then a reasonable kebab-case match).
- If no name was given and `specs/` has exactly one file, use it.
- If `specs/` has multiple files and it's not obvious from recent conversation which one applies, list them and ask which to review.
- If `specs/` doesn't exist or is empty, say so and stop — there's nothing to review against. Don't improvise a spec from memory or guess at requirements.

## 2. Build the checklist

Pull every checkable item out of three sections of the spec: **Requirements** (including sub-bullets — treat each as its own item if it's independently checkable), **Edge Cases** (each "when X happens, Y should occur" is one item), and **Definition of Done** (each checkbox is one item).

Skip the **Out of scope** sub-section entirely — those are explicitly not requirements, so they're not graded. (If you happen to notice the build did something listed as out of scope anyway, you can mention it as a side note at the end, but it's not a failure and shouldn't affect the verdict.)

This checklist is the entire scope of the review. Don't add items the spec doesn't contain, and don't fold in general code-quality opinions, style preferences, or things you'd personally do differently — that's a different job (`/code-review`, if this project has it). A requirement not in the spec is not this skill's concern, even if it seems obviously important.

## 3. Verify each item — don't just read code and assume

For each checklist item, find the code that's supposed to implement it, then confirm it actually behaves that way. Reading the implementation and concluding "looks right" is not verification — the whole point of this skill is to catch the gap between what the code appears to do and what it actually does.

Match the verification to what the item claims:
- **A behavior a user triggers** (a click, a submission, a state transition): exercise it for real — run the app, hit the actual UI or API, and observe the actual result. If a preview/browser tool is available and the project is a UI app, use it rather than trusting the JSX.
- **A data rule or constraint** (validation, a required field, an access restriction): trigger the condition and confirm the enforcement actually fires — not just that a check exists somewhere in the code path.
- **An edge case or failure mode**: force the actual condition (bad input, empty state, the specific failure named) and observe what happens, rather than reasoning abstractly about what the code "should" do.
- **A definition-of-done checkbox**: verify it exactly as written — if it says "user can do X and sees Y," do X and confirm Y is what appears, don't infer it from the code that handles X.

If something can't be verified in this environment (e.g. it needs a real email inbox, a second physical device, a paid service you don't have credentials for), say so explicitly and mark it **unverified** rather than guessing — don't count it as either pass or fail, and call it out in the report so the user knows it still needs a human check.

For a spec with many requirements touching unrelated parts of the codebase, it's fine to parallelize investigation (e.g. dispatch a few read-only exploration agents against different requirement groups) — but you make the final pass/fail call yourself after seeing the evidence, not by trusting a summary uncritically.

## 4. Report findings

For every checklist item, record one of:
- **Met** — verified working as specified.
- **Not met** — doesn't work, is missing, or contradicts the spec.
- **Partially met** — some of the item works, part doesn't (e.g. the happy path works but a named edge case in the same requirement isn't handled).
- **Unverified** — couldn't be checked in this environment; say why.

For every **Not met** or **Partially met** item, name the exact spec item it fails (quote or closely paraphrase the spec's own wording, don't summarize it into something vaguer) and write the specific fix: what file/behavior needs to change and what it should do instead, concrete enough that a build pass doesn't have to re-derive the requirement from scratch. Group fixes so related ones (same file, same feature area) sit together.

Structure the output:

```markdown
# Review: <spec name>

## Verdict: PASS | FAIL

<one-line summary — e.g. "14/16 requirements met, 2 gaps found" or "all requirements met">

## Gaps and fixes
(omit this section entirely if the verdict is PASS)

### <Spec item, quoted or closely paraphrased>
**Status:** Not met | Partially met
**What's wrong:** <the actual gap/bug — what happens vs. what the spec requires>
**Fix:** <the specific change needed>

(repeat per failing item)

## Unverified
(omit if nothing was unverifiable)
- <item> — <why it couldn't be checked>

## Met
<a compact list of every item confirmed met — brief, no need to re-justify each one>
```

## 5. The pass gate

The verdict is **PASS** only if every Requirements, Edge Cases, and Definition of Done item is confirmed **Met**. Any **Not met**, **Partially met**, or **Unverified** item means **FAIL** — unverified items block a pass because "couldn't check it" is not the same as "it works." Don't round up, don't pass something because the gap seems minor, and don't let the number of items already passing soften the verdict on the ones that aren't.

Do not fix anything yourself, even a one-line fix you're confident about. The gaps section is the handoff to a build pass — leave the fixing to that step.
