# Safety Guardrails

Global rules for any agent running in this workspace:

1. Never run destructive system-level deletion commands. Disallow patterns like `rm -rf /`, `rm -rf ~`, `rm -rf /var`, `rm -rf /usr`, `rm -rf /etc`, wildcard mass deletes, and Docker host-path deletes.
2. Never run destructive git commands unless user explicitly asks in the current message. Disallow `git reset --hard`, `git clean -fd`, `git branch -D`, `git checkout .`, and `git restore .`.
3. Never run `git push` without explicit user authorization in the current message.
4. Avoid context-flooding commands. Do not run broad scans from filesystem roots (`rg /`, `find /`) or dump very large files/logs directly.
5. For file/log inspection, always prefer bounded output first:
   - `sed -n '1,200p' <file>`
   - `tail -n 200 <file>`
   - `rg -n <pattern> <scoped-dir>`
   - `docker logs --tail 200 <container>`
6. If a command may generate huge output, scope it, add limits, and summarize key lines instead of dumping raw output.

## Delegation Preference

User preference for this workspace:

1. For substantive tasks (coding, debugging, analysis, refactor, research), delegate execution to subagents first instead of doing primary implementation in main agent.
2. Keep main agent focused on orchestration: scope task, assign ownership, integrate outputs, run verification, and report final result.
3. Parallelize aggressively when work can be split into independent vertical slices with disjoint ownership.
4. Scale number of subagents to task complexity; avoid unnecessary fan-out for tiny tasks.
5. If policy/tooling constraints block delegation, state constraint clearly and continue with best local execution.
