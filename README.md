# agent-principles

Engineering principles packaged as [Agent Skills](https://agentskills.io): short,
opinionated `SKILL.md` files that tell a coding agent how to think about a class
of problem, such as where validation belongs, when a test proves anything, or what
to delete before adding something new.

Each skill's `description` is written as a trigger ("Apply when…"), so the agent
loads a principle when the work in front of it matches, not all the time. Every
file uses only the five portable frontmatter fields (`name`, `description`,
`license`, `compatibility`, `metadata`). Any host that reads the Agent Skills
format can load them unchanged.

## Install

**Claude Code, as a plugin:**

```text
/plugin marketplace add lgarceau768/agent-principles
/plugin install agent-principles@agent-principles
```

**Claude Code, as personal skills** (no plugin namespace):

```bash
git clone https://github.com/lgarceau768/agent-principles.git
cp -rf agent-principles/skills/* ~/.claude/skills/
```

Use `.claude/skills/` inside a repository to scope them to that project.

**Other hosts:** copy the directories under `skills/` into the host's skills
folder. Keep them together. Several skills link to each other by relative path.

## The skills

<!-- skills:begin -->
| Skill | Apply when |
|---|---|
| [`principle-authorize-before-you-look-up`](skills/principle-authorize-before-you-look-up/SKILL.md) ¹ | adding or reviewing any endpoint, handler, or resolver that takes an identifier from a caller. Decide whether the caller is allowed before you fetch the thing they named, or the difference between your 403 and your 404 tells them what exists. |
| [`principle-boundary-discipline`](skills/principle-boundary-discipline/SKILL.md) | wiring validation, error handling, or framework adapters. Concentrate guards at system boundaries (CLI, config, network, external APIs); trust internal types and keep business logic in pure functions. |
| [`principle-build-the-lever`](skills/principle-build-the-lever/SKILL.md) | the work is non-trivial, not only when it is bulk work — edits, migrations, analyses, checks. Build the tool that does it or proves it (codemod, script, generator, or a skill your subagents follow) instead of working by hand. The tool is the artifact a reviewer can rerun. |
| [`principle-encode-lessons-in-structure`](skills/principle-encode-lessons-in-structure/SKILL.md) | you catch yourself writing the same instruction a second time, or notice a recurring correction. Encode the rule as a lint, metadata flag, runtime check, or script instead of more text. |
| [`principle-exhaust-the-design-space`](skills/principle-exhaust-the-design-space/SKILL.md) | facing a novel UI interaction or architectural decision with no precedent in the codebase. Build 2-3 competing prototypes and compare side by side before committing. |
| [`principle-experience-first`](skills/principle-experience-first/SKILL.md) | product, UX, or feature-scope tradeoffs come up. Choose user delight over implementation convenience; ship fewer polished features over more rough ones. |
| [`principle-fix-root-causes`](skills/principle-fix-root-causes/SKILL.md) | debugging. Trace each symptom to its root cause and fix it there; reproduce first, ask why until you reach it, resist nil-check guards that silence crashes. |
| [`principle-foundational-thinking`](skills/principle-foundational-thinking/SKILL.md) | choosing core types and data structures before writing logic, sequencing scaffold-vs-feature work, or asking what concurrent actors share. Get the data structures right so downstream code becomes obvious. |
| [`principle-guard-the-context-window`](skills/principle-guard-the-context-window/SKILL.md) | context is filling up — large outputs, long files, repeated reads, fan-out planning. Route bulk to subagents; keep summaries in the main thread, not raw payloads. |
| [`principle-laziness-protocol`](skills/principle-laziness-protocol/SKILL.md) | refactoring, evaluating diff size, or tempted to add abstractions, layers, or signal threading. Bias toward deletion and the smallest change that solves the problem. |
| [`principle-make-operations-idempotent`](skills/principle-make-operations-idempotent/SKILL.md) | designing commands, lifecycle steps, or processing loops that run amid crashes, restarts, and retries. Converge to the same end state regardless of partial prior runs. |
| [`principle-migrate-callers-then-delete-legacy-apis`](skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md) | introducing a new internal API while old callers still exist. Migrate callers and delete the old API in the same wave instead of preserving compatibility layers. |
| [`principle-minimize-reader-load`](skills/principle-minimize-reader-load/SKILL.md) | reviewing or shaping code that's hard to trace. Count layers between question and answer, and hidden state in the reader's head; collapse one-caller wrappers and shrink mutable scope. |
| [`principle-model-the-domain`](skills/principle-model-the-domain/SKILL.md) | writing stateful logic, or when code branches a lot or repeats a shape assumption across files. Encode the domain in a structure instead of scattered conditionals. |
| [`principle-never-block-on-the-human`](skills/principle-never-block-on-the-human/SKILL.md) | tempted to ask 'should I do X?' on reversible work. Proceed, present the result, let the human course-correct after the fact; reserve confirmation for irreversible actions. |
| [`principle-outcome-oriented-execution`](skills/principle-outcome-oriented-execution/SKILL.md) | running a planned rewrite or migration with explicit phase boundaries. Converge on the target architecture; don't preserve smooth intermediate states with throwaway compatibility code. |
| [`principle-prove-it-works`](skills/principle-prove-it-works/SKILL.md) | a task is complete and you are about to declare it done. Verify against the real artifact (run the feature, read the actual value, inspect the diff), not a proxy, self-report, or 'it compiles.' |
| [`principle-redesign-from-first-principles`](skills/principle-redesign-from-first-principles/SKILL.md) | integrating a new requirement into an existing design. Redesign as if the requirement had been a foundational assumption from day one, instead of bolting it on. |
| [`principle-separate-before-serializing-shared-state`](skills/principle-separate-before-serializing-shared-state/SKILL.md) | concurrent actors might write to the same file, branch, key, or state object. Eliminate the sharing first; serialize structurally only when one shared writer is a real invariant. |
| [`principle-sequence-verifiable-units`](skills/principle-sequence-verifiable-units/SKILL.md) | doing multi-step work (sweeps, migrations, runs of similar edits) and when stacking commits and PRs. Break work into small units that each end in a verifiable state, check each before the next, and order delivery so the sequence proves itself to a reviewer. |
| [`principle-subtract-before-you-add`](skills/principle-subtract-before-you-add/SKILL.md) | sequencing an addition, refactor, or rewrite. Remove dead weight, redundant validators, and stub references first, then build on the simpler base. |
| [`principle-type-system-discipline`](skills/principle-type-system-discipline/SKILL.md) | designing types, reviewing a function signature, or writing code in any statically-typed language. Make illegal states unrepresentable, brand semantic primitives, parse external data at boundaries, refuse to lie to the compiler, exhaust variants, derive from authoritative schemas. |
<!-- skills:end -->

¹ Original to this repository. Every other skill is derived from pstack; see
[Provenance](#provenance).

## Provenance

These skills were extracted from a larger private agent stack, where they are
the principle layer that its roles and workflows load by name. This repository
publishes only that layer, with references to the rest of the stack removed.

Twenty-one of the skills are derived from
[pstack](https://github.com/cursor/plugins/tree/main/pstack) v0.14.4 by Lauren
Tan, under the MIT licence. Each derived skill says so in its own frontmatter
(`metadata.derived-from: pstack@0.14.4`), so the attribution travels with the
file wherever it is installed. [NOTICE.md](NOTICE.md) has the details and
pstack's licence text.

## Contributing

```bash
node scripts/lint.mjs          # check every skill and the table above
node scripts/lint.mjs --write  # regenerate the table after adding a skill
```

The lint rejects any frontmatter field outside the portable five, a `name` that
does not match its directory, a description that does not start with "Apply
when" or "Use when", and a relative link that does not resolve. CI runs it on
every push and pull request.

## Licence

[MIT](LICENSE). Derived material also carries pstack's MIT notice; see
[NOTICE.md](NOTICE.md).
