# OpenCode Agent System

> Complete backup of an OpenCode environment: 43 skills, 16 agents, config, plugins, instructions, and a fully automated setup script. If your PC catches fire, one command rebuilds everything.

Adapted from [AgentSystemLabs/core](https://github.com/AgentSystemLabs/core) — opinionated, production-hardened SKILL.md workflows and reviewer subagents, optimized for OpenCode with CodeGraph-native awareness.

## What's Included

| Component | Count | Description |
|-----------|-------|-------------|
| Skills | 43 | Workflow orchestrators (features, bugs, audits, git, docs, infra) |
| Agents | 16 | Read-only reviewers + utility subagents |
| Instructions | 5 | Behavioral rules loaded every session |
| Plugins | 2 | Guardrails (bash safety) + AgentMemory capture |
| Commands | 2 | `/recall` and `/remember` for persistent memory |
| Config | 1 | `opencode.jsonc` + `AGENTS.md` |
| Wrapper | 1 | Auto-starts AgentMemory before OpenCode |
| Setup script | 1 | Fully automated installation from scratch |

## Quick Start (Full Setup)

If you have a fresh machine:

```bash
git clone https://github.com/Acauhi99/opencode-agent-system.git
cd opencode-agent-system
bash scripts/setup.sh
```

This installs everything: Node.js, OpenCode binary, MCP servers, LSP servers, config files, skills, agents, and the wrapper script.

## Install (CLI Only)

If you just want to install skills/agents/config into an existing OpenCode setup:

```bash
npx @acauhi/opencode-agent-system init --global
```

### Options

| Flag | Description |
|------|-------------|
| `--force`, `-f` | Overwrite existing files |
| `--skip-agents` | Skip installing agents |
| `--skip-skills` | Skip installing skills |
| `--skip-config` | Skip installing config (instructions, plugins, commands) |
| `--global`, `-g` | Install to `~/.config/opencode/` |
| `--dest <dir>` | Custom base directory |

## Commands

```bash
# List all available skills, agents, and config
npx @acauhi/opencode-agent-system list

# Install everything
npx @acauhi/opencode-agent-system init --global

# Remove everything
npx @acauhi/opencode-agent-system uninstall --global

# Run full setup script
npx @acauhi/opencode-agent-system setup
```

## Usage

After installing, open OpenCode and use these commands:

```
/start "describe your goal"     # universal entry point — classifies intent, picks depth, routes
/add-feature "..."              # end-to-end feature delivery
/fix-bug "..."                  # diagnose silent failures
/audit                          # whole-codebase tech-debt sweep
/recall [query]                 # search past session memories
/remember [insight]             # save to persistent memory
```

## Project Structure

```
opencode-agent-system/
├── cli/
│   └── index.js              # CLI: init, list, uninstall, setup
├── agents/                   # 16 subagent definitions (.md)
├── skills/                   # 43 skill directories (SKILL.md each)
├── config/                   # OpenCode config backup
│   ├── opencode.jsonc        # Main config (MCP, permissions, plugins)
│   ├── AGENTS.md             # CodeGraph usage guide
│   ├── instructions/         # 5 behavioral instruction files
│   ├── plugins/              # 2 TypeScript plugins
│   └── commands/             # 2 custom commands
├── scripts/                  # Setup automation
│   ├── setup.sh              # Full install script
│   ├── opencode-wrapper      # Wrapper that auto-starts AgentMemory
│   └── requirements.txt      # Global npm packages list
├── package.json
├── README.md
└── LICENSE
```

## Prerequisites

Skills are **CodeGraph-native** — they use [CodeGraph](https://github.com/colbymchenry/codegraph) for sub-millisecond, tree-sitter-parsed codebase exploration instead of grep. The setup script installs CodeGraph automatically.

For manual installation:

```bash
npm install -g @colbymchenry/codegraph
codegraph init -i  # per-project
```

Skills fall back to `grep` + `read` + `glob` when `.codegraph/` is not initialized.

## AgentMemory

The wrapper script auto-starts [AgentMemory](https://github.com/rohitg00/agentmemory) for persistent cross-session memory. It captures session observations, tool usage, and context — then recalls them in future sessions.

- `/recall [query]` — search past sessions
- `/remember [insight]` — save to long-term memory

## Uninstall

```bash
npx @acauhi/opencode-agent-system uninstall --global
```

## License

MIT — same as the original AgentSystemLabs/core.

## Credits

Built on the excellent work of [AgentSystemLabs/core](https://github.com/AgentSystemLabs/core). The original skills were designed for Claude Code; this adaptation retargets them for OpenCode with CodeGraph-native codebase exploration, `question` tool for user prompts, and OpenCode's subagent architecture.
