# Subagent Orchestration Always

Use subagent orchestration by default for broad, complex, or parallelizable work.

Rules:
- Keep primary context small.
- Split broad work into independent vertical slices before editing.
- Launch parallel subagents when slices can avoid file conflicts.
- Use `explore` for read-only codebase discovery.
- Use `general` for implementation or multi-step investigation.
- Give subagents tight scope, conflict boundaries, verification steps, and concise return format.
- Primary agent owns integration, final verification, and user-facing summary.
- Do not use subagents for trivial one-file edits, simple commands, or work where all agents would touch same hot files.
