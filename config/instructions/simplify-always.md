# Simplify Always

After any code change that modifies files, invoke the simplify skill as a post-step.

Rules:
- Before invoking, check `git diff --stat` to confirm there are uncommitted changes. If diff is empty, skip (nothing to simplify).
- **Skip if the core skill already runs simplify internally.** Skills that already call `skill({ name: "simplify" })` as a post-step: `add-feature`, `modify-feature`, `fix-bug`, `remove-feature`, `realign`, `reorganize-files`, `address-pr-comments`. If the change was produced by one of these, do NOT invoke simplify again — the skill already did it.
- After implementation or bug fix completes, scan the diff for DRY violations, duplicate code, magic numbers, poor naming, and missed reuse of existing utilities.
- Mechanical fixes (rename local, extract constant, swap for existing util, delete dead comment) apply immediately.
- Structural fixes (extract function, split component, replace duplication with shared helper) require user confirmation via question tool.
- Do not expand scope beyond changed files unless a flagged smell explicitly points to siblings.
- Skip for: type-only edits, pure formatting, generated files, comment-only changes.
