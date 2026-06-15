# Harden Types Always

After any TypeScript code change, review the diff for type-safety issues.

Rules:
- Flag every `: any`, `as <T>`, `as unknown as <T>`, `@ts-ignore`, `@ts-expect-error` in changed files.
- **Skip if the core skill already runs type hardening internally.** Skills that already call `skill({ name: "harden-types" })` as a post-step: `audit` (via Phase 4 parallel fan-out). If the change was produced by one of these, do NOT invoke harden-types again.
- Before removing an `as` cast, read the call site that produces the value — the cast's correctness depends on its source, not its target.
- Mechanical fixes (concrete type replace, cast removal where structurally safe, add return type to exported function) apply immediately.
- Boundary entry points (HTTP body, server-fn input, webhook payload, env parsing, IPC) that lack validation — propose adding zod schema (or existing project validator).
- Do not auto-install a validator dependency without explicit user confirmation.
- Skip for: pure JS files, generated code, test fixtures with intentional `as any`, discriminated-union narrowing.
