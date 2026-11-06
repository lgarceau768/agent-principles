---
name: principle-subtract-before-you-add
description: "Apply when sequencing an addition, refactor, or rewrite. Remove dead weight, redundant validators, and stub references first, then build on the simpler base."
license: MIT
metadata:
  derived-from: pstack@0.14.4
  category: simplicity
  summary: "Delete dead weight first, then build on the smaller base."
  when: "Sequencing an addition, refactor, or rewrite."
---

# Subtract Before You Add

When evolving a system, remove complexity first, then build. Deletion gives you a simpler base, which makes the next addition smaller and less brittle.

**Why:** Adding to a complex system compounds complexity. Removing first cuts the surface area, reveals the essential structure, and usually makes the next design obvious. Default to subtraction.

Make simplification a continual investment. Leave the design slightly simpler and more capable behind the same or smaller surface than you found it.

**The pattern:**
- Sequence removal before construction
- Cut before you polish (get to the minimum before investing in quality)
- Design for observed usage, not speculative edge cases
- No speculative validators, parsers, or guards beyond what the spec demands
- Out-of-spec features drag validators behind them. Persistence, retry-on-startup, and schema migration each need guards to defend their inputs.
- Simplify prompts (remove redundant instructions, excessive templates)
- When a reference has no novel content, delete it rather than leaving a stub

**Subtract from your own diff before anyone else reads it.** The rule is usually
read as being about the code you found. It applies at least as much to the code
you just wrote: a constant added for a message that ended up phrased inline, an
exception class that a later refactor made unreachable, an import left behind by
a deleted call. None of it is legacy — it is minutes old, it was needed for a
version of the design that no longer exists, and it is invisible to the author
precisely because they remember intending it.

This is cheap for a reviewer to find and expensive for them to find, in the
sense that it costs a round trip to say something the author could have seen. So
read your own diff as a stranger before you push, and ask of every added symbol
whether anything references it. The static analyser will say so eventually; it
says so after the review, which is the wrong end.
