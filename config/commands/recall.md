Search past session observations and lessons for relevant context. Wrap the `memory_smart_search` and `memory_lesson_recall` MCP tools.

## Usage

```
/recall [query]
```

## Instructions

1. Call `memory_smart_search` with the query and `limit: 10`.
2. If available, call `memory_lesson_recall` with the same query and `limit: 5`.
3. Combine results and present only what the tools returned.
4. If no results, suggest 2-3 alternative search terms.
