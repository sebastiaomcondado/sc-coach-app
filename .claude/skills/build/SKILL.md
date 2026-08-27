---
name: build
description: Read a spec file under specs/ and build exactly what it describes — nothing added, nothing refactored that isn't in scope. Use this whenever the user runs /build, or asks to "build the spec," "implement specs/<name>.md," or turn a spec into working code. After building, report which spec requirements were covered so a /review pass can check them. Do not use this for open-ended feature requests that have no spec file — that's normal development, not this skill.
---

# Build

Turn a spec into working code, and only that spec. The spec is the entire brief — not a starting point to improve on, not a suggestion to build the "better" version of. If `/review` runs after this and finds a gap, that's a missing or wrong requirement to fix, not an invitation to add anything beyond what closes that gap.

## 1. Find the spec

- If the user named a spec (`/build <name>`, a path, or a feature mentioned in context), use `specs/<name>.md`.
- If no name was given and `specs/` has exactly one file, use it.
- If `specs/` has multiple files and it's not obvious which one applies, list them and ask.
- If `specs/` doesn't exist or is empty, say so and stop. This skill builds from a spec — it doesn't invent one. If the user wants something built without a spec, that's normal development, not this skill.

## 2. Read the whole spec before touching anything

Read Objective, Requirements (including the Out of scope sub-section), Edge Cases, and Definition of Done in full before writing code. The Objective tells you the *why*, which matters for resolving small ambiguities the same way the spec's author would; the other three sections are the literal build targets.

Build a checklist the same way `/review` does: every Requirements item (sub-bullets count individually if independently checkable), every Edge Case ("when X happens, Y should occur"), every Definition of Done checkbox. This checklist is what you're building — and later, what you report back on. **Out of scope items are off-limits**, not low-priority — don't build them even partially, even if one would be trivial to add while you're already in that code.

## 3. Check what's already there before writing anything

Don't assume the codebase is empty. Investigate what already exists for each checklist item first — this may be a fresh build, or it may be a fix-up pass after `/review` found specific gaps in an already-mostly-built feature. Either way:

- If an item is already fully implemented and working, leave it alone. Don't rewrite, refactor, or "clean up" code that already satisfies the spec just because you'd have written it differently.
- If an item is partially implemented, extend or fix only the missing/broken part — not the parts that already work.
- If the user handed you specific gaps (e.g. pasted a `/review` findings report), treat that as your primary work list, but still verify against the spec directly rather than trusting the report blindly — specs and reports can drift out of sync with each other.

## 4. Build within the lines

- **No scope creep.** Don't add error handling, inputs, settings, or polish the spec didn't ask for, even if it seems obviously good practice. If you notice something genuinely broken or risky that's unrelated to this spec, mention it at the end as a separate note — don't fold it into this build.
- **No unrelated refactoring.** Touch the files and code paths the spec's requirements actually require. A messy neighboring function is not this skill's problem unless the spec's requirement can't be implemented without changing it.
- **No invented requirements.** If the spec is silent or ambiguous on an implementation detail (exact wording, a schema field, a layout choice), make the smallest reasonable choice consistent with how the rest of the codebase already does similar things — don't design a new pattern when an existing one already fits.
- **Match the existing codebase's conventions** — naming, file structure, styling approach, error-handling style, libraries already in use. The spec describes behavior, not implementation; let the existing code decide the implementation style.

## 5. Verify your own work before reporting done

At minimum: the project builds/typechecks/lints clean. Beyond that, exercise the specific behavior you built where it's feasible in this environment (run it, hit the UI/API, check the data) — enough to be confident it actually works, not just that it compiles. This doesn't need to be as exhaustive as `/review`'s audit (that's the next step, and its job specifically), but don't hand off code you haven't seen work at all.

## 6. Report what was covered

Finish with a checklist matching the spec's own items one-to-one — the same granularity `/review` would use, so its findings line up directly against this list:

```markdown
# Build: <spec name>

## Covered
- <spec item> — <one line on what was built/changed, or "already implemented, unchanged">
(repeat per item you addressed)

## Not covered
- <spec item> — <why: out of scope for this pass, blocked on something, needs a decision, etc.>
(omit if nothing's outstanding)

## Notes
(optional — anything noticed outside the spec's scope that's worth a separate look, or ambiguities you resolved and how)
```

Every checklist item from step 2 should appear in either "Covered" or "Not covered" — nothing silently dropped.
