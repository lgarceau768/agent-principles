---
name: principle-prove-it-works
description: "Apply when a task is complete and you are about to declare it done. Verify against the real artifact (run the feature, read the actual value, inspect the diff), not a proxy, self-report, or 'it compiles.'"
license: MIT
metadata:
  derived-from: pstack@0.14.4
---
# Prove It Works

Verify every task output by checking the real thing directly. Do not infer from proxies, self-reports, or "it compiles."

**Why:** Unverified work has unknown correctness. Indirect verification (file mtimes, output freshness, agent self-reports, cached screenshots) feels cheaper than direct observation. Acting on a wrong inference costs far more than checking the source.

**Pattern:** After completing any task, ask: "how do I prove this actually works?"

Check the real thing, not a proxy:

- Check process liveness directly, not indirectly through derived state
- Read the actual value, not a cached or derived representation
- When verification fails, suspect the observation method before suspecting the system

Code and features:

1. Build it (necessary but not sufficient)
2. Run it and exercise the actual feature path
3. Check the full chain: does data flow from input to output?
4. For integrations, test the full communication path end-to-end

Delegation: trust artifacts, not self-reports. When verifying delegated work, inspect the actual output artifact (git diff, file contents, runtime behavior, live screenshots), not the delegate's summary. Agents report what they intended, not always what happened.

## A guard test has to be shown catching its mistake

A **guard test** is one written to catch one specific mistake: a precedence
guard, a bounds check, an assertion that a socket is not bound wide. For these,
green is not the observation. **"The test passes" and "the test can fail" read
identically** — in a transcript, in a diff, and in an exit code. A guard test
that would pass against the broken code it was written to reject looks exactly
like one that would not, and that has happened: a SQL operator-precedence
test passed against deliberately broken SQL, and only a hand mutation found it.

So the check is not "does it pass". It is **break the thing on purpose and watch
this test go red**:

1. **Declare the mutation in the test file**, so the next person does not have
   to reconstruct your intent:

   ```
   @guards   <path to the guarded file, from the repo root>
   @mutation replace `<exact text>` with `<exact text>`
   @catches  <the mistake, in one sentence>
   ```

2. **Run it unmutated first.** A red run proves nothing about the mutation
   unless the same selector was green without it — a test failing for an
   unrelated reason produces exactly the red a mutation would.
3. **Apply the mutation, run again, and check the failure names your test** —
   not just that the run went red. A run that errored and a test that caught
   something return the same exit status.
4. **Put the target back**, and confirm the bytes match.

**A mock is the common way to write a test that cannot fail for the right
reason.** `verify(statement).execute()` asserts that a call happened. It says
nothing about what the call *did* — swap the SQL for something that updates
every row in the table and the assertion still holds, because the assertion was
never about the SQL. Same for a stub returning a fixed value and a spy counting
invocations: they check the shape of the conversation, not the content, and a
guard test whose subject is content must reach the real thing.

The mutation step finds this on its own, which is the point of running it: break
the guarded line, and a test that only watched the call go past stays green. If
your demonstration will not go red, the test is not guarding what you thought.

If your tooling can record these four steps as evidence, let it. If not, do them by
hand — but do them, and say in your report which mutation you applied and what
went red. A guard test nobody has seen fail is a guard test nobody has tested.

## Script the check when you can

The strongest proof is a deterministic script that re-runs the same comparison, not a one-time eyeball. Write the script, run it, and keep its output as an artifact a reviewer can re-run instead of trusting your word. A script comparing the old and new compiled output catches what a glance misses.

Keep the artifact visible for the human. Commit it only for large or complex work where the trail has to be auditable later, like a big port or migration. Most work just needs it visible, not committed.