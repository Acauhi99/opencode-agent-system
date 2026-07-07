# Sleep Short Always

When the agent needs to use `sleep` in commands (e.g. waiting for a process, polling a status), always use short sleeps of 30 seconds or less to iterate faster and check what's happening.

Rules:
- Prefer 30s sleeps for status checks and polling loops.
- Never sleep more than 60s without explicit user approval.
- After each sleep, check status before sleeping again.
- Use `wait` or process-specific checks over blind sleep when possible.
