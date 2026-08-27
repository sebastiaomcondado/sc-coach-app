---
name: spec
description: Interview the user about a feature or app they want built, one focused question at a time, and write the result to a spec file under specs/. Use this whenever the user runs /spec, or asks to "write a spec," "spec this out," or "figure out the requirements" before any code gets written. Do not start building or writing implementation code during this skill — it only produces a spec document.
---

# Spec

Turn a vague idea into a written spec through a focused interview, then save it. Nothing gets built during this skill — the deliverable is the spec file itself.

## Why an interview instead of just asking for everything at once

A wall of questions makes people answer shallowly, in whatever order is easiest, and skip the parts that actually needed thought. Asking one thing at a time forces each answer to be considered, and lets you follow up on anything vague, contradictory, or surprising before moving on — which is exactly the information a spec needs to be worth writing down.

## The interview

Ask **one question at a time** and wait for the answer before asking the next. Don't present a numbered list of questions, and don't bundle two questions into one message.

Cover this ground, adapting order and phrasing to what the user already told you (skip anything already answered clearly; don't re-ask it):

1. **The core idea.** What are they building, in their own words? What's it for, and who is it for?
2. **The primary goal / success.** What does this feature or app need to achieve? What's the main job it has to do well?
3. **Must-have requirements.** Drill into the specific behaviors, inputs, outputs, and functionality that are non-negotiable. Ask follow-ups until these are concrete enough that someone else could implement them without guessing — vague answers like "it should be fast" or "it should work well" need a follow-up to pin down what that actually means here.
4. **Explicitly out of scope.** What's tempting to include but should NOT be part of this — either for now or ever? This is as important as the requirements list; it stops scope creep later.
5. **Constraints.** Technical constraints (existing stack, must integrate with X, performance/security requirements), and non-technical ones (timeline, who else touches this, external dependencies).
6. **Edge cases and failure modes.** What happens with bad input, empty states, concurrent use, network/service failure, permission issues, or anything else that could go wrong? If the user hasn't thought about this, prompt them with a couple of scenarios specific to what they're building and ask which apply.
7. **Definition of done.** How would someone who didn't build this verify it's actually finished and correct? Push for concrete, checkable statements ("user can do X and sees Y") rather than vague ones ("it works well").

Keep questions short and specific. If an answer is thin or ambiguous, follow up immediately rather than moving on and hoping it gets clearer later — the spec can only be as precise as the interview.

You'll know you have enough when you could write each section below without inventing anything the user didn't actually say (reasonable, clearly-labeled assumptions for small unstated details are fine — silently making up requirements is not).

## Do not start building

Do not write implementation code, scaffold files, or install anything during this skill, even if the user's answers make the solution obvious or they say something like "yeah just build it that way." If they ask you to start implementing mid-interview, either finish the spec first and confirm it with them, or confirm that they want to skip straight to building — either way, that's their call to make explicitly, not something to slide into.

## Writing the spec

Once the interview has covered the ground above, write the spec to `specs/<name>.md`, where `<name>` is a short kebab-case slug derived from the feature/app name (create the `specs/` directory if it doesn't exist). Confirm the filename with the user if it's not obvious from context.

Use this structure exactly — all four sections are required:

```markdown
# <Feature/App Name>

## Objective
1-3 sentences: what this is, who it's for, and why it's being built.

## Requirements
The exact, non-negotiable behaviors and functionality. Write these as specific,
checkable statements, not vague goals. Use sub-bullets for detail where a single
requirement has multiple parts. Include an "Out of scope" sub-section listing
what's explicitly excluded, if the user specified any.

## Edge Cases
Every edge case, failure mode, or unusual scenario surfaced during the interview,
each with the expected behavior. Format as "When X happens, Y should occur" —
not just a list of scenarios without resolutions.

## Definition of Done
A concrete, checkable list (checkboxes) that someone who did NOT build this
could use to verify the build is complete and correct. Each item should be
objectively verifiable — avoid anything that requires guessing at intent.
```

After writing the file, tell the user where it was saved and give a one-line summary of what it covers. Ask if anything needs correcting before they consider it final — don't assume silence means approval if you just wrote it.
