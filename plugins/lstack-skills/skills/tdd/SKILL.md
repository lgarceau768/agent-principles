---
name: tdd
description: "Use when a bug is about to be fixed and there is a cheap, obvious local test target, or when a failing test or a regression test has been asked for. Skip it when the test path is unclear, expensive, integration-heavy, or nobody asked, and say in the report why it was skipped."
license: MIT
metadata:
  derived-from: pstack@0.14.4
  category: code
  summary: "Write the failing test first, then attack the assertion you just wrote."
  when: "Fixing a bug or building a unit whose check is a test."
---

# TDD Bug Fix

When fixing a bug with a clear, cheap test path, make the broken behavior executable before changing production code. The goal is a focused regression test that fails before the fix and passes after it.

Do not force a test when it would be impractical. If the available test would require broad harness setup, brittle mocks, slow end-to-end infrastructure, production-only state, vague reproduction steps, or large unrelated fixture churn, skip adding a new test and use the closest useful verification instead.

## Workflow

1. **Understand the bug.** Identify the intended behavior, current behavior, affected path, and smallest observable reproduction.
2. **Choose the narrowest executable check.** Prefer the closest unit, component, integration, or regression test already used for that codepath. If no practical test path is obvious, do not create one from scratch just to satisfy the workflow.
3. **Write the failing test first.** Add the smallest focused test that would have caught the bug. The test should encode intended behavior, not mirror the current implementation.
4. **Run the new test before fixing.** Confirm it fails for the intended reason. If it passes or fails for an unrelated reason, correct the test or reproduction before editing the implementation.
5. **Fix the bug.** Make the smallest production change that satisfies the intended behavior while preserving nearby contracts.
6. **Rerun the regression test.** Confirm the test now passes.
7. **Run nearby validation.** Run relevant adjacent tests, type checks, lint, or scenario checks when the change has broader risk.

## Attack the Assertion You Just Wrote

A test that fails before the fix and passes after it has shown one thing: that
it responds to that fix. It has not shown that it would catch the next change to
break the same behaviour. Two questions close that gap, and both are asked
before the step is called done.

**Can the state under test occur at all?** Trace the value the test feeds in
back to where it comes from. A fallback branch written for a missing field, and
a test that proves the fallback renders, are both dead when the only producer of
that data structurally cannot omit the field — a query on a sort key always
returns it. A test for an unreachable state is not coverage; it is a test with
no subject, and the fix is to delete the branch and the test rather than to keep
both green.

**Would the assertion still pass if the code were wrong?** Mutate the thing it
covers and rerun: swap two values, change a string, invert a condition. If the
test still passes, the assertion is not pinning what it appears to pin. Five
assertions that each checked a string appeared *somewhere on the page* passed
with two of the page's subtitles swapped, so that every card explained a
different card — scoping each assertion to its own element is what made them
fail. Undo the mutation once it has told you what it came to tell you.

Where a mutation cannot be run cheaply, say so in the report rather than
implying the assertion was attacked.

## If a Failing Test Is Impractical

Do not silently skip the regression step. Before fixing, explicitly explain why a failing test is impossible or not worth the cost, then choose the closest executable regression check available. Examples include a targeted script, manual reproduction command, browser automation, snapshot comparison, log assertion, or focused integration check.

Prefer no new test over a bad test. A bad test is one that mostly tests mocks, encodes current implementation details, depends on timing or unrelated global state, needs expensive infrastructure for a small fix, or would be deleted immediately after proving the fix.

## Guardrails

- Do not change tests merely to match a wrong implementation.
- Do not weaken existing assertions unless the expected behavior has genuinely changed and the reason is clear.
- Keep the regression test focused on the bug; avoid broad fixture churn or unrelated coverage expansion.
- Do not add tests when the practical signal is weak; use manual or scripted verification and say why.
- If the bug is flaky, make the test deterministic where possible and document the signal being locked down.
- If the bug exposes a broader class of failures, first land the focused regression path, then consider additional sibling coverage.

## Final Response

Report the evidence, not just the outcome:

- Name the failing-before test or executable check and the failure it produced.
- Name the passing-after test run and any nearby validation performed.
- If failing-before evidence could not be demonstrated, state why and describe the closest regression check used instead.
