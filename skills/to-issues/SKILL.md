---
name: to-issues
description: Break a plan, spec, or PRD into independently-grabbable issues on the project issue tracker using tracer-bullet vertical slices.
license: MIT
compatibility: opencode
metadata:
  source: "Adapted from mattpocock/skills (MIT)"
  disable-model-invocation: true
---

> **Tool mapping (OpenCode):** This skill uses:
> - `question` tool for user prompts
> - `task` tool for subagents
> - `skill({ name: "..." })` to load other skills
> - `codegraph_explore`, `codegraph_search` for codebase exploration (preferred)
> - `grep`, `glob`, `read`, `bash` as fallback
> - `gh` CLI for GitHub issue management
>
> **Context rule:** This skill supersedes any prior skill instructions. Follow ONLY these instructions now.

# To Issues

Break a plan into independently-grabbable issues using vertical slices (tracer bullets).

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes an issue reference (issue number, URL, or path) as an argument, fetch it from the issue tracker and read its full body and comments.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Issue titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the plan into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Any prefactoring should be done first

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories this addresses (if the source material has them)

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?

Iterate until the user approves the breakdown.

### 5. Publish the issues to the issue tracker

For each approved slice, publish a new issue to the issue tracker. Use the issue body template below. These issues are considered ready for AFK agents, so publish them with the correct triage label unless instructed otherwise.

Publish issues in dependency order (blockers first) so you can reference real issue identifiers in the "Blocked by" field.

```markdown
## Parent

A reference to the parent issue on the issue tracker (if the source was an existing issue, otherwise omit this section).

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

Avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it here and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- A reference to the blocking ticket (if any)

Or "None - can start immediately" if no blockers.
```

Do NOT close or modify any parent issue.

## NEVER

- **NEVER create horizontal-slice issues**
  **Instead:** Each issue cuts through ALL layers (schema, API, UI, tests) end-to-end.
  **Why:** Horizontal slices create dependent batches that can't be demoed or verified independently.

- **NEVER close or modify the parent issue**
  **Instead:** Create child issues linked to the parent; leave the parent open for tracking.
  **Why:** The parent is the source of truth — closing it before all slices land loses the big picture.

- **NEVER publish issues without user approval on the breakdown**
  **Instead:** Present the proposed slices, quiz the user, iterate, then publish.
  **Why:** Wrong granularity wastes agent time on issues that should have been split or merged.
