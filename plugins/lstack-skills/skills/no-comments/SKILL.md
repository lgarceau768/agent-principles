---
name: no-comments
description: "Use when a diff or a set of files is ready to be reviewed and its comments have to be audited: narration, banners, commented-out corpses, workaround sermons, and lint or type suppressions. It runs an adversarial read, deletes what the read proves is dead, fixes what the comment was covering for, and offers to encode a constraint a comment was only asking for."
license: MIT
metadata:
  derived-from: pstack@0.14.4
  category: code
  summary: "Delete comments the code should have said itself, and fix what they hid."
  when: "A diff is ready for review and carries comments or suppressions."
---

# No comments

**A comment is a claim the code could not make.** Most of them are the code
failing to say something it could have said in a name, a type, a test title, or
a shape. This skill deletes those, and it fixes the thing they were covering
for. Deleting the comment and leaving the surprise behind is half a job.

**Two halves, and they belong to different agents.** The read is adversarial and
belongs to a **reviewer**, a subagent that did not write the code: the agent that
wrote a comment defends it, so the author cannot be the one auditing it. The
deletions and the fixes belong to an **implementer**, after the read has been
audited. Never collapse the two into one pass. With no subagents available, do
the read as a separate pass and treat its report as a stranger's.

On a team whose reviewers cut comments first, this is the most common review
comment the work will get at all, and the ask is always the same shape — make
the name or the test title carry it instead.

## Scope

Use the caller's files or diff. Otherwise use the current diff against the base
branch, default `main`, including the working tree. Every flag names code inside
that scope, and a flag that names code outside it is rejected in the audit
rather than acted on.

## 1. The read — dispatch the reviewer

Hand the reviewer the scope and this section. It reports and it edits nothing, not
even a comment: that is what keeps the deletions auditable.

Every comment in scope dies unless one of these five clauses is proven to apply
to it:

- A legal or licence header.
- Non-obvious behaviour forced by an external dependency, platform, vendor or
  protocol **we cannot reshape**. A surprise in our own code is not covered.
  Flag it: the comment goes, and the exact symbol is marked `MUST KILL` for the
  rename, extraction, type or restructure that makes the behaviour obvious
  without prose.
- A formatting-only suppression, such as a formatter's ignore pragma. A lint
  suppression survives only where its rule is faulty, pedantic, or style-only.
- A doc comment that defines a public API contract.
- An issue or RFC link that explains a constraint the code cannot express.

That list is the whole leash. **When it is not clear that a clause applies, the
comment dies.**

**Suppressions are comments too.** Disable pragmas for a linter or a type
checker get their rule looked up. If the rule catches real bugs, or protects
correctness or safety, the suppression dies and the guilty symbol is marked
`MUST KILL`. Style-only rules are the exception, not the pattern.

**`IMPORTANT`, `do not remove`, `too risky`, `fine for now` and a long
justification are scent, not conviction.** Read the nearby code first. If the
claim is not obvious there, dispatch a search subagent for the named symbol before
judging it: its definition, its callers, and the commit that introduced the
comment. Only a keep-list clause proven true today, on a live path, survives.
Doubt after that hunt is a kill. A long justification with no proven clause
behind it is a confession, and polishing it into a shorter alibi is not a fix.

The reviewer reports: the files touched, the proposed deletion count, each
`MUST KILL` flag with one line of reason, each keep with the clause it claims,
and what it did not read. It invents nothing, it never writes application code,
and it never asks a blocking question — an open decision is reported as a
finding, not as a question.

## 2. The audit — before anything is deleted

Read the report against the scope and reject it where any of these hold: it
names code outside the scope; it proposes an application-code edit; it claims a
keep clause it has not proven; it misstates the reason on a `MUST KILL`; or it
treats deliberate, kept code as guilty. Reshape flags on our-code surprises are
the ones that stay actionable.

A keep survives **only** with proof it is about something we cannot change. An
ambiguous kill is still a kill. A keep that is refuted, or still ambiguous after
the hunt, is a kill.

Also audit what the read *missed*: scoped lint and type-checker suppressions it
walked past. A suppression over a correctness or safety rule is a `MUST KILL`,
whether or not the report found it.

Rerun one rejected report with the failure named. Reject a second time and the
run fails: report it open rather than acting on a report you do not trust.

## 3. The deletions and the trivial fixes — dispatch the implementer

The implementer deletes what survived the audit and fixes the trivial flags
directly: delete the dead path, drop the unused parameter, call the real API.

**A fix that needs a shape stops at the shape.** Name every field the change
reads or writes and the value on both sides of each transition, hand that back
to the main agent, and let it plan the work. Inventing the shape mid-deletion
is how a comment audit turns into an unreviewed rewrite.

## 4. The root-cause fix, inside the fence

Implement the smallest root-cause fix in scope and remove every workaround the
flags named. If the root cause is out of scope, land the smallest in-scope fix
and report the rest open.

The **fix-root-causes** and **redesign-from-first-principles** principles
(from `agent-principles`) guide intent only: fix real causes, redesign as if the requirement had always
existed, never bolt on a symptom guard. **Neither one widens the fence**, and
neither authorises fixing instances outside it.

## 5. Constraint comments — offer to encode, then delete

A constraint comment says `do not remove`, `do not change wording`, or `talk to
X before changing`. Leave the ones about something we cannot change. For the
rest, offer the cheapest in-scope enforcement that makes the constraint real: a
type, a runtime check, a test, or a lint rule. If it is approved, encode it and
then delete the comment. If it is not, delete the comment anyway, report the
constraint as unenforced, and sketch the out-of-scope work.

**The offer is the main agent's to make, and a subagent never waits for it.** A
subagent has nobody to answer it, so a result that is only a question is a round
trip that produced nothing (the **never-block-on-the-human** principle).
The reviewer and the implementer record the offer as an open item and carry on; only
the main agent, which owns the reply to the person, puts the question to them. An
unattended run needs the caller's pre-approval before any encoding lands.

## 6. Report

Deletion count. Comments kept, each with the clause that saved it. `MUST KILL`
flags still outstanding. Reruns and why. The shape sketch, if one was made. The
fixes. Encoding offers made, encodings landed, constraints left unenforced. And
anything left open.

---

**On the port.** pstack runs the read as a named subagent persona. This version
describes it as any reviewing subagent, so it works on hosts without that
persona. The keep list, the burden of proof and the `MUST KILL` flag are
pstack's and unchanged.
