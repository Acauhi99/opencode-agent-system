# OpenCode Agent System

> Adapted from [AgentSystemLabs/core](https://github.com/AgentSystemLabs/core) — 37+ opinionated, production-hardened SKILL.md workflows and 16 reviewer subagents, optimized for OpenCode with CodeGraph-native awareness.

## Prerequisites

Skills are **CodeGraph-native** — they use [CodeGraph](https://github.com/colbymchenry/codegraph) for sub-millisecond, tree-sitter-parsed codebase exploration instead of grep. Install it once per project:

```bash
# Install the CodeGraph CLI
# See: https://github.com/colbymchenry/codegraph

# Build the index for your project
codegraph init -i
```

Skills prefer `codegraph_explore`, `codegraph_search`, `codegraph_context`, `codegraph_files`, and `codegraph_callers`. When `.codegraph/` is not initialized, they auto-detect and **fall back** to `grep` + `read` + `glob` — slower, but functional.

## Install

```bash
npx @acauhi/opencode-agent-system init
```

Or global:

```bash
npx @acauhi/opencode-agent-system init --global
```

### Options

| Flag | Description |
|------|-------------|
| `--force`, `-f` | Overwrite existing skill files |
| `--skip-agents` | Install skills only, skip subagents |
| `--dest <dir>` | Custom base directory (default: `.opencode/`) |

## Usage

After installing, open OpenCode and use these commands:

```
/ship "describe your goal"     # autopilot — classifies intent, picks depth, routes to core skill
/add-feature "..."             # end-to-end feature delivery
/fix-bug "..."                 # diagnose silent failures
/audit                         # whole-codebase tech-debt sweep
```

See all skills: `npx @acauhi/opencode-agent-system list`

## Skills

37 skills covering: workflow orchestration, feature delivery, debugging, code quality, refactoring, UI/UX polish, audits, release management, docs sync.

## Subagents

16 subagents (11 reviewers + 5 operational) for: authz, security, data integrity, contracts, concurrency, error boundaries, loading states, a11y, client bundle, observability, performance, and more.

## Uninstall

```bash
npx @acauhi/opencode-agent-system uninstall
npx @acauhi/opencode-agent-system uninstall --global
```

## License

MIT — same as the original AgentSystemLabs/core.

## Credits

Built on the excellent work of [AgentSystemLabs/core](https://github.com/AgentSystemLabs/core). The original skills were designed for Claude Code; this adaptation retargets them for OpenCode with CodeGraph-native codebase exploration, `question` tool for user prompts, and OpenCode's subagent architecture.
