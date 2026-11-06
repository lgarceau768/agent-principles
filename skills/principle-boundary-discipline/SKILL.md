---
name: principle-boundary-discipline
description: "Apply when wiring validation, error handling, or framework adapters. Concentrate guards at system boundaries (CLI, config, network, external APIs); trust internal types and keep business logic in pure functions."
license: MIT
metadata:
  derived-from: pstack@0.14.4
---

# Boundary Discipline

Place validation, type narrowing, and error handling at system boundaries. Trust internal code unconditionally. Business logic lives in pure functions; the shell is thin and mechanical.

**Why:** Scattered validation is noisy, redundant, and gives a false sense of safety. Validate data once at the boundary. Keep logic out of framework wiring so it can be tested without the framework.

**The pattern:**
- **At boundaries** (CLI args, config files, external APIs, network protocols): validate, return errors, handle defensively.
- **Inside the system:** typed data, error propagation, no re-validation. Trust the types.
- **Across the boundary.** Expose domain concepts, not the boundary's private representation. Keep general-purpose mechanism inside and special-purpose policy at the edge.

**Applications:**

Validation and error handling:
- Validate config at parse time (the boundary), not inside business logic
- Parse raw data into domain types at the boundary
- Do not re-export transport, storage, framework, or wire types through the public surface
- No redundant nil checks deep in call chains if the boundary already validated

Code organization:
- Business logic in pure functions with no framework dependencies
- Parse functions: pure transforms from raw bytes to typed state
- Prompt construction: structured state in, string out
- Scoring and assessment: pure transforms from state to results

**The tests:**
- "Is this data crossing a system boundary right now?" If not, validation is redundant.
- "Can this be a pure function that the shell just calls?" If yes, extract it.

## The test harness is a boundary too, and it stays on its own side

A branch in production code that exists so a test can reach it is the boundary
crossed backwards. The conditional ships to production, where the condition is
always false and nothing exercises it; the thing it was accommodating lives in
the suite, where it is now invisible. Both halves get worse.

It arrives reasonably. A method takes a connection it does not own, the test
needs the transaction to roll back, and the cheapest fix is a flag in the
method. Then the flag is production behaviour, and a reader has to work out
which of its two paths is real.

The accommodation belongs in the test: a wrapper, a proxy around the resource,
a fixture. If it genuinely cannot live there, that is a design finding about the
seam — the production code is not injectable at the point it should be — and
the answer is to fix the seam, not to add the flag.

**The test:** delete every test in the repo. Does this branch still have a
reachable true case? If not, it is test scaffolding shipped in the wrong file.
