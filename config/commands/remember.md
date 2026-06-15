Explicitly save an insight, decision, or learning to agentmemory for future sessions. Wraps the `memory_save` MCP tool.

## Usage

```
/remember [what to remember]
```

## Instructions

1. Extract the core insight, decision, or fact.
2. Extract 2-5 searchable concepts.
3. Extract relevant file paths, if any.
4. Call `memory_save` with `content`, `concepts`, `files`, and `type`.
5. Confirm the save and show the tagged concepts.
