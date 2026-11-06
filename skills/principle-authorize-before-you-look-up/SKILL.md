---
name: principle-authorize-before-you-look-up
description: "Apply when adding or reviewing any endpoint, handler, or resolver that takes an identifier from a caller. Decide whether the caller is allowed before you fetch the thing they named, or the difference between your 403 and your 404 tells them what exists."
license: MIT
metadata:
  category: reliability
  summary: "Check permission before the fetch, or 403 vs 404 leaks what exists."
  when: "An endpoint or handler takes an id from the caller."
---

# Authorize Before You Look Up

When a request names a resource, run the permission check **before** the lookup,
not after it. The order is the security property. Getting it backwards produces
an endpoint that is correctly authorized and still leaks.

**Why:** A handler that loads first and checks second answers differently for an
id that exists and an id that does not — `403` for the real one, `404` for the
fake one. Neither response contains the resource. Together they are an oracle:
an unauthorized caller enumerates ids and learns which are real, one request at
a time, from an endpoint that never returned a single byte of data it should
not have.

The leak is in the *pair*, which is why it survives review. Each response, read
on its own, is correct. Each is even the response a careful person would have
chosen. Nothing about the diff looks like a vulnerability, and the check that
would have caught it — "does this method authorize?" — passes.

## The pattern

1. **Resolve the caller's identity and scope first.** Whatever the request
   carries — a role, a tenant, an organization, a workspace — read it before
   touching storage.
2. **Decide on what the caller supplied**, not on what the lookup returned.
   Permission that depends on the loaded object is a second, narrower check;
   it is not the first one.
3. **Answer unauthorized and not-found the same way** wherever the distinction
   is itself sensitive. Usually that means `404` for both: "no resource you can
   address" is true in both cases and says nothing about which.
4. **Log the difference even though you do not return it.** The distinction is
   real, it matters for debugging and for detecting enumeration, and the log is
   where it belongs.

## Two things this is not

**It is not "add an authorization annotation".** Presence is the check every
review checklist already makes, and presence is what the leaking version has.
Ask where in the call the check runs, not whether it is there.

**It is not only about permission.** Any predicate the caller does not control
and cannot see behaves the same way: scope, tenancy, feature flags, soft
deletes. If a request for something outside your reach fails differently from a
request for something that never existed, the pair is still an oracle.

## The test

Send two requests as a caller with no rights: one naming a resource that exists,
one naming an id that does not. **The responses must be indistinguishable** —
same status, same body, and close enough in timing that the difference is not
the answer either. If you can tell them apart, so can anybody else.

## Where it comes from

A code review on a service update endpoint. A role check lived
inside the update method, which ran after the controller had already loaded the
requested record, so a caller holding the resource permission but not the role
got `404` for an unknown id and `403` for a real one. It was the only genuine
security finding in a long multi-round review, and it was found by reading the
order of two correct-looking lines.
