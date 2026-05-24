---
name: ship
description: Autopilot orchestrator for engineering work. Classifies the user's request as CREATE / EVOLVE / POLISH / REMOVE / FIX / AUDIT, infers a depth mode (fast / balanced / production) from risk + complexity signals, announces the pipeline, then routes to the matching core skill (add-feature / modify-feature / polish-ui / remove-feature / fix-bug / audit) with mode= and any include= / skip= overrides. STOPS at code-ready — never commits, pushes, or opens PRs. Use when the user describes a goal and wants the system to pick the right workflow and depth on its own. Trigger phrases — "ship", "/ship", "ship this", "just build this", "make this happen", "figure it out for me", "autopilot this", "engineer this end-to-end", "production-ready this". Skip for — when a specific workflow is already named (call /add-feature, /modify-feature, /polish-ui, /fix-bug, /remove-feature directly), pure git operations (/commit, /commit-and-push, /open-pr), planning-only requests, or single-line cosmetic tweaks done inline without orchestration.
license: MIT
compatibility: opencode
metadata:
  source: "Adapted from AgentSystemLabs/core (MIT)"
  requires_codegraph: true
---

> **Tool mapping (OpenCode):** This skill uses:
> - `question` tool for user prompts (not `AskUserQuestion`)
> - `task` tool for subagents (not `Agent` or `Task` subagent syntax)
> - `skill({ name: "..." })` to load other skills (not `Skill(skill="...", args="...")`)
> - `codegraph_explore`, `codegraph_search`, `codegraph_context` for codebase exploration (preferred)
> - `todowrite` for phase/progress tracking
> - `grep`, `glob`, `read`, `bash` as fallback when `.codegraph/` not initialized
>
> **Context rule:** This skill supersedes any prior skill instructions. Follow ONLY these instructions now. Read the user's goal and any mode/include/skip from the conversation context.

Read `mode=`, `include=`, and `skip=` from the conversation context. Default to the mode specified in this skill if not provided.

# ship

The user gave you an engineering goal. Pick the right workflow, pick the right depth, announce both, run the workflow, report. Stop before git.

The tax on a vibe coder is choosing which skill to invoke and how thorough to be. This skill takes that tax off them — without hiding what was decided.

---

## Step 1 — Classify intent

Use `todowrite` to mark this step as in_progress. Mark it completed when done.

Read the user's prompt and map to one of six core skills:

| Phrasing in the prompt | Intent | Routes to |
|---|---|---|
| "add", "build", "implement", "create", "scaffold", "introduce", "set up" in an existing codebase | CREATE | `add-feature` |
| "update", "extend", "change", "also do X when Y", "make this also", "modify", "derive from" — request adds or shifts behavior on an existing feature; also handles small cosmetic/copy tweaks via `mode=fast` | EVOLVE | `modify-feature` |
| "polish this", "give this a UX pass", "polish the dashboard", "audit the polish on this page", "run the UX checklist on X" — apply UX checklist to existing UI without changing behavior | POLISH | `polish-ui` |
| "remove", "delete", "deprecate", "kill", "rip out", "get rid of" | REMOVE | `remove-feature` |
| "broken", "bug", "not working", "should have happened but didn't", "didn't trigger", "silent failure" | FIX | `fix-bug` |
| "audit the codebase", "tech-debt sweep", "deep clean", "full cleanup", "production-readiness pass", "find all the rot" | AUDIT | `audit` |

**EVOLVE vs POLISH boundary.** EVOLVE is one specific change the user named (whether it's a single-element cosmetic tweak or a behavior extension); POLISH is "apply the checklist" without a specified change. If the user names what to change, it's EVOLVE. If they ask for a pass, it's POLISH. For purely cosmetic single-element changes ("make this button green", "fix the alignment"), route to EVOLVE with `mode=fast`.

**Ambiguous prompts** — when two intents are equally plausible (e.g., "rebuild auth" could be EVOLVE or REMOVE+CREATE), ask exactly one disambiguating `question`. Don't guess.

**Multi-intent prompts** — if the user lists clearly separable goals ("add X and remove Y"), execute them sequentially as separate /ship routings, not one combined run. State the order before starting.

**No-match prompts** — if the user's request doesn't fit any of the six intents above (e.g., explain code, document a flow, compare approaches, ask a question about the codebase, brainstorm features, or scaffold a new app from zero), /ship is the wrong tool. Stop and tell the user the request doesn't map to an engineering workflow this skill orchestrates, and — if the match is obvious — point at the matching skill directly (e.g., "review this PR" → `/review`, "sync the docs" → `/sync-docs`, "explain this module" → no skill needed, just answer in the conversation).

---

## Step 2 — Infer the depth mode

Use `todowrite` to mark this step as in_progress. Mark it completed when done.

Three modes — `fast`, `balanced`, `production`. Pick one before announcing.

**Risk signals (any one → `production`)**:
- Touches auth, permissions, payments, billing, secrets, or external webhooks
- Schema migration or persisted-data rewrite
- Destructive deletion or deprecation of an external/public contract
- Background jobs, queues, cron, retries, email/SMS/push, imports/exports, file writes, spawned processes, IPC, or external APIs
- Caching, query invalidation, feature flags, analytics/business reporting, or concurrency-sensitive mutations
- Multi-subsystem in the same change (frontend + backend + DB)

**Tiny-scope signals (all four → `fast`)**:
- Single file
- Cosmetic / copy / styling only
- No data layer touched
- No new public API surface

**Default → `balanced`**.

**Override:** explicit `mode=fast`, `mode=balanced`, or `mode=production` in the user's prompt always wins — except when it conflicts with a high-risk signal (see NEVER below).

---

## Step 3 — Announce the plan

Use `todowrite` to mark this step as in_progress. Mark it completed when done.

Output a structured plan block before executing. Format:

```
Detected: <CREATE | EVOLVE | POLISH | REMOVE | FIX | AUDIT>
Risk:     <low | medium | high — one-line reason>
Mode:     <fast | balanced | production — one-line reason or "user-specified">
Pipeline:
  1. <phase>  → <core skill or sub-skill>
  2. <phase>  → <core skill or sub-skill>
  ...
```

Pipeline numbering must match what the routed core skill will actually run at the chosen mode (e.g., `add-feature mode=production` does Clarify → Explore → Design → Plan approval → Implement → Verify → Gated reviews → Tests → Post-steps). Do not invent phases the routed skill won't execute — those become a credibility hole at Step 5.

**Confirmation gating depends on mode:**

| Mode | Gating |
|---|---|
| `production` | Use `question` "Proceed with this pipeline?" before Step 4. Decline → stop. |
| `balanced` | Print the plan inline, then proceed to Step 4 in the same turn. User can abort with ESC or a new prompt before the routed skill begins. |
| `fast` | Print the plan inline as a one-line preamble, then execute immediately. No confirm prompt. |

---

## Step 4 — Execute via the routed core skill

Use `todowrite` to mark this step as in_progress. Mark it completed when done.

Invoke the matching core skill with the `skill` tool. The skill reads the user's goal and mode/include/skip from the conversation context — no explicit args needed. Pass any mode/include/skip via the conversation context before invoking.

Example invocation for CREATE at production mode:

```
skill({ name: "add-feature" })
```

The core skill runs the actual workflow. /ship is a router, not a re-implementation.

**Host-portability fallback.** The `skill` tool is an OpenCode primitive and may not exist in other agent CLIs (OpenAI Codex, Cursor, Cline, raw API runs, etc.). If `skill` is not available in the current session:

1. Read the routed skill's SKILL.md directly — it lives at `skills/<skill-name>/SKILL.md` in this repo, or the equivalent path under `.opencode/skills/` or `~/.config/opencode/skills/` where the host loads skills from.
2. Execute its instructions inline as your next phase of work, passing the same args you would have passed to `skill(...)`.
3. Surface the degradation in the Step 3 announcement: add a line like `Routing:  inline (skill tool unavailable — no subagent isolation, parent context will carry the routed skill's work)`. The user must know the run isn't isolated.

Inline execution loses subagent context isolation but preserves routing decisions, mode propagation, and downstream audit gates. That is acceptable degradation. Refusing to run because `skill` is missing is not.

**Respect downstream gates.** `add-feature mode=production` has its own Plan-approval gate. Let it fire. Don't bypass it from /ship.

**One core skill per /ship run.** Don't fan out to multiple core skills in parallel — that's the user's job to compose with multiple /ship invocations, or the routed core skill's job to subagent-fan-out internally.

**Adjunct skills live downstream.** /ship only chooses the top-level workflow. The routed skill owns stack/plugin-specific handoffs (TanStack, UX, backend, release-risk, etc.) and must announce those adjuncts in its own pipeline when their gates match.

---

## Step 5 — Report and hand off to git

Use `todowrite` to mark this step as in_progress. Mark it completed when done.

After the routed skill returns, output a visible-pipeline summary:

```
✔ <phase 1>  — <one-line outcome>
✔ <phase 2>  — <one-line outcome>
✔ <phase 3>  — <one-line outcome>
...

Findings:
  - <each finding the routed skill or its sub-skill audits surfaced>

Code is production-ready. To publish:
  • /commit           — group the working tree into staged commits without pushing
  • /commit-and-push  — commit then push the current branch to its remote
  • /open-pr          — open a GitHub PR (commits then pushes if needed)
```

Surface findings, not just "done." If a sub-skill audit (security, perf, a11y, duplication) returned issues that the routed skill chose not to auto-fix, name them here so the user sees them before publishing.

**Do not commit. Do not push.** The user picks the publish path.

---

## NEVER

- **NEVER commit, push, or open PRs from inside this skill**
  **Instead:** Stop at Step 5 and direct the user to `/commit`, `/commit-and-push`, or `/open-pr`.
  **Why:** Engineering rigor and release decisions run on different cadences. Auto-publishing from an autopilot run removes the user's chance to review the diff and forces a one-size-fits-all release path on every project.

- **NEVER bypass a routed core skill's own approval gate**
  **Instead:** Let the gate fire (e.g., `add-feature`'s Plan-approval gate in production mode). The user interacts with the core skill's gate, not with /ship.
  **Why:** Routing past a gate that the core skill author put there means the user gets a fast-mode experience while believing they're in production mode. Trust collapses on the first surprise side effect.

- **NEVER replicate the core skill's pipeline inline from memory**
  **Instead:** Always delegate. Use the `skill` tool when the host exposes it; when it doesn't (Codex and other non-OpenCode hosts), Read the routed skill's SKILL.md and follow that file verbatim — do not improvise the pipeline from your own recall of what `add-feature` or `fix-bug` "usually does". /ship is a router; the SKILL.md is the engine.
  **Why:** Inlined pipelines drift from canonical core-skill behavior on every update. Two implementations of the same workflow guarantees one will be wrong after the next change to either. Reading the file each run keeps the engine canonical even when the `skill` tool isn't available.

- **NEVER hide which mode and pipeline you picked**
  **Instead:** Announce in every mode. Even `fast` prints the one-line preamble. `production` requires an explicit confirm.
  **Why:** "It just worked" is indistinguishable from "it did the wrong thing silently." The product story is "AI engineering workflow," not "ChatGPT writes code." Visibility is the differentiator.

- **NEVER guess between two plausible intents**
  **Instead:** When the prompt is genuinely ambiguous (CREATE vs EVOLVE, EVOLVE vs REMOVE+CREATE), ask exactly one `question`. One question, then commit.
  **Why:** A wrong intent cascades through the entire pipeline. The user only notices at Step 5 that the system rebuilt instead of patched, after the work is done. One disambiguation up-front is far cheaper than a wrong full-pipeline run.

- **NEVER honor a `mode=fast` override on a high-risk change without surfacing the conflict**
  **Instead:** If `mode=fast` is requested for work that hits a risk signal (auth/payments/migrations/jobs/webhooks/destructive deletes/etc.), pause and surface the conflict via `question`: "Detected high-risk signals (e.g., payments). You requested fast mode — that skips the production gates. Confirm fast anyway, or upgrade to production?" Honor whichever the user picks.
  **Why:** Vibe coders bypass safety gates because they don't know what they're skipping. Surfacing the conflict gives them informed consent without removing their authority. Silent honor of a dangerous override breaks the "no surprises" contract.

---

## Appendix — Sub-skills the routed front doors hand off to

`/ship` itself is a router; the *adjunct* and *handoff* skills below are owned by the routed core skill (add-feature, modify-feature, fix-bug, remove-feature, audit). This appendix exists so users — and the announced pipeline at Step 3 — can see what the front door will likely invoke downstream when its gates trigger. The routed skill always has final say on whether a gate fires.

**Phrasing for Step 3 announcements:** when previewing the pipeline, name the most likely downstream sub-skills as `(routed: <core>) → may invoke <sub-skill>` rather than promising they'll run. The actual fire is gate-driven.

### CREATE → `add-feature` may invoke

- **UI scaffolding (when feature is user-facing):** `skill({ name: "add-empty-error-states" })` (empty + error UI), `skill({ name: "polish-ui" })` (post-step UX checklist), `skill({ name: "propagate-ui-pattern" })` (when 3+ siblings of a recurring surface exist).
- **Backend scaffolding (when persisted data or schema changes):** `skill({ name: "add-migration" })`, `skill({ name: "add-observability" })` (integration-first lane), `skill({ name: "audit-authz" })` (when the feature adds or changes server entry points with ownership/permission checks).
- **Tests (Phase 8):** `skill({ name: "write-tests" })` (unit/integration), `skill({ name: "add-e2e-test" })` (browser flows when Playwright is wired).
- **Audits (Phase 7 gates):** `task({ subagent_type: "reviewer-contracts", description: "Audit contracts", prompt: "audit contracts for the change" })`, `task({ subagent_type: "reviewer-concurrency", description: "Audit concurrency", prompt: "audit concurrency for the change" })`, `task({ subagent_type: "reviewer-data-integrity", description: "Audit data integrity", prompt: "audit data integrity for the change" })`, `task({ subagent_type: "reviewer-security-regression", description: "Audit security regression", prompt: "audit security regression for the change" })`, `task({ subagent_type: "reviewer-error-boundaries", description: "Audit error boundaries", prompt: "audit error boundaries for the change" })`, `task({ subagent_type: "reviewer-loading-states", description: "Audit loading states", prompt: "audit loading states for the change" })`, `task({ subagent_type: "reviewer-accessibility-regression", description: "Audit accessibility regression", prompt: "audit accessibility regression for the change" })`, `task({ subagent_type: "reviewer-client-bundle", description: "Audit client bundle", prompt: "audit client bundle for the change" })`, `task({ subagent_type: "reviewer-observability-coverage", description: "Audit observability coverage", prompt: "audit observability coverage for the change" })`, `task({ subagent_type: "audit-perf", description: "Audit performance", prompt: "audit performance for the change" })`, `task({ subagent_type: "audit-responsive", description: "Audit responsive design", prompt: "audit responsive design for the change" })`, `skill({ name: "code-enforce-route-data" })`, `skill({ name: "code-enforce-layers" })`.
- **Cleanup (post-step):** `skill({ name: "simplify" })`, `skill({ name: "polish-ui" })`.

### EVOLVE → `modify-feature` may invoke

- **UI extensions:** `skill({ name: "add-empty-error-states" })`, `skill({ name: "polish-ui" })`.
- **Backend extensions:** `skill({ name: "add-migration" })`, `skill({ name: "add-observability" })`, `skill({ name: "audit-authz" })` (when the extension touches server entry points with ownership/permission checks).
- **Tests:** `skill({ name: "write-tests" })`, `skill({ name: "add-e2e-test" })` when extension warrants browser coverage.
- **Contract / concurrency / data audits:** `task({ subagent_type: "reviewer-contracts", description: "Audit contracts", prompt: "audit contracts for the change" })`, `task({ subagent_type: "reviewer-concurrency", description: "Audit concurrency", prompt: "audit concurrency for the change" })`, `task({ subagent_type: "reviewer-observability-coverage", description: "Audit observability coverage", prompt: "audit observability coverage for the change" })`, `task({ subagent_type: "reviewer-data-integrity", description: "Audit data integrity", prompt: "audit data integrity for the change" })`, `task({ subagent_type: "reviewer-security-regression", description: "Audit security regression", prompt: "audit security regression for the change" })`, `task({ subagent_type: "reviewer-error-boundaries", description: "Audit error boundaries", prompt: "audit error boundaries for the change" })`, `task({ subagent_type: "reviewer-loading-states", description: "Audit loading states", prompt: "audit loading states for the change" })`, `task({ subagent_type: "reviewer-accessibility-regression", description: "Audit accessibility regression", prompt: "audit accessibility regression for the change" })`, `task({ subagent_type: "reviewer-client-bundle", description: "Audit client bundle", prompt: "audit client bundle for the change" })`.
- **Cleanup:** `skill({ name: "simplify" })`, `skill({ name: "polish-ui" })`.

### POLISH → `polish-ui` may invoke

`polish-ui` runs the project's UX polish checklist against the surface and auto-fixes mechanical gaps (kbd hints on hotkey-bound buttons, focus management, loading/disabled states, footer/chrome consistency). It does not fan out — the work *is* the checklist.

### FIX → `fix-bug` may invoke

- **Regression pinning (after fix lands):** `skill({ name: "add-regression-test" })`.
- **Polish if UI changed:** `skill({ name: "polish-ui" })`.

### REMOVE → `remove-feature` may invoke

- **Schema cleanup:** `skill({ name: "add-migration" })` (when removal drops columns/tables).
- **Verification:** `task({ subagent_type: "reviewer-data-integrity", description: "Audit data integrity", prompt: "audit data integrity for the removal" })` and `task({ subagent_type: "reviewer-contracts", description: "Audit contracts", prompt: "audit contracts for the removal" })`.

### AUDIT → `audit` may invoke

- The full reviewer-* subagent family across the repo, plus `task({ subagent_type: "audit-perf", description: "Audit performance", prompt: "audit performance across the repo" })`, `task({ subagent_type: "audit-a11y", description: "Audit accessibility", prompt: "audit accessibility across the repo" })`, `task({ subagent_type: "audit-responsive", description: "Audit responsive design", prompt: "audit responsive design across the repo" })`, `task({ subagent_type: "audit-seo-meta", description: "Audit SEO meta", prompt: "audit SEO meta across the repo" })`, `task({ subagent_type: "audit-analytics", description: "Audit analytics", prompt: "audit analytics across the repo" })`, `skill({ name: "simplify" })`, `skill({ name: "harden-types" })` — see `audit/SKILL.md` for the full menu.

**Course-author note:** because these are gate-driven, a given /ship run will invoke only a subset. The Step 5 pipeline summary names exactly which ones did fire — that's the authoritative record, not this appendix.
