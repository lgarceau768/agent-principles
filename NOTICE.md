# NOTICE

This repository contains material derived from **pstack**.

| | |
|---|---|
| **Project** | pstack |
| **Author** | Lauren Tan |
| **Licence** | MIT |
| **Version read** | v0.14.4 |
| **URL** | https://github.com/cursor/plugins/tree/main/pstack |

## Which files are derived

Every derived skill marks itself in its frontmatter:

```yaml
license: MIT
metadata:
  derived-from: pstack@0.14.4
```

So the derived set is a grep rather than a list that can go stale:

```bash
grep -rl --include=SKILL.md "derived-from: pstack@0.14.4" skills/ plugins/
```

A skill without that marking was written for this repository.
`principle-authorize-before-you-look-up` is the only one so far. A derived
skill's `references/` files are covered by its `SKILL.md`.

Both plugins carry derived material: `agent-principles` (under `skills/`) and
`lstack-skills` (under `plugins/lstack-skills/skills/`).

Derived does not mean verbatim. Some skills were edited after they were ported.
`principle-prove-it-works` gained a section on showing that a guard test
catches the mistake it was written for, and `tdd` gained "Attack the Assertion
You Just Wrote". `no-comments` was rewritten so a generic reviewing subagent and
implementer, not pstack's named persona, do the read and the deletions. One
word in `unslop`'s abstract-metaphor list was swapped out for another. The
licence applies either way.

## MIT License (pstack)

```
MIT License

Copyright (c) 2026 Lauren Tan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
