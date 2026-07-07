---
name: resolve-before-report
description: Before surfacing single-finding questions, auto-apply safe mechanical fixes. Check 5 criteria: context-complete, reversible, pattern-matching, low-stakes, user opt-in. Apply safe findings, surface only what needs user decision. Trigger: before presenting findings reports.
license: MIT
compatibility: opencode
---

Before surfacing a findings report, auto-resolve safe items.

## Auto-resolve criteria (ALL 5 must hold)

1. **Context-complete** — file:line, proposed change, diff in context.
2. **Reversible** — no destructive delete, no push, no schema migration, no external contract change.
3. **Pattern-matching** — matches a known safe pattern (`: any` removal, `as T` cast removal, missing return type, dead comment, magic number extraction, format fix).
4. **Low-stakes** — does not touch auth, payment, secret, session, schema, webhook, destructive infra, or external/public API.
5. **User opt-in** — skill invoked with `mode=production` or `mode=balanced`, OR `/audit` / `/simplify` / `/check-pr-readiness` invoked.

## Never resolve

- Auth, permission, payment, billing, secret, session handling.
- Schema migrations, especially destructive.
- `rm`, `git push`, `git push -f`, `git reset --hard`, `git clean -f`.
- Cross-module rename with external consumers.
- Anything in user's AGENTS.md guardrails.

## Pattern → action

| Pattern | Action |
|---------|--------|
| `: any` in arg with concrete call site | infer type, remove `any` |
| `as T` structurally compatible | remove cast |
| Missing return type on exported function | add inferred type |
| `console.log` / `debugger;` / `.only(` | delete |
| Format check failed + auto-fix exists | run format script |
| Magic number with clear meaning | extract named constant |
| Dead comment / orphan TODO | delete |

## Report format

Append to parent skill's report:
```
[resolve-self] Applied N safe findings; surfacing M for your decision.
  - file:line — <one-line fix>
```
