# Memory Save Rules

When to save to agentmemory and when to skip.

## Save

- **Architecture decisions** — "chose X over Y because Z", "module A owns B"
- **Bugs found** — root cause, not symptoms. "X was Y because of Z in file:line"
- **Patterns discovered** — "this codebase uses X convention for Y"
- **User preferences** — "user prefers X over Y", "always do Z"
- **Workflow rules** — "never commit without running X", "this project uses Y for Z"
- **Lessons** — what worked, what failed, gotchas

## Don't save

- Code that already exists in the repo (read it, don't copy it to memory)
- Temporary output, logs, command results
- Anything retrievable via grep/read in <10 seconds
- Duplicate of existing memory (check first with `agentmemory_memory_smart_search`)
- Session-specific context that won't apply next time

## How to save

Use `agentmemory_memory_save` with:
- `content`: the insight, not a transcript
- `type`: pattern | preference | architecture | bug | workflow | fact
- `concepts`: comma-separated keywords for retrieval
- `files`: relevant file paths

Keep it short. One insight per save. Memories are for cross-session recall, not journaling.
