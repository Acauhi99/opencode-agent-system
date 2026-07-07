# OpenCode Agent System

> Complete backup of an OpenCode environment: 50 skills, 8 agents, config, plugins, instructions, bundled Ponytail (lazy senior dev mode), and a fully automated setup script. If your PC catches fire, one command rebuilds everything.

Adapted from [AgentSystemLabs/core](https://github.com/AgentSystemLabs/core) — opinionated, production-hardened SKILL.md workflows and reviewer subagents, optimized for OpenCode with CodeGraph-native awareness.

## What's Included

| Component | Count | Description |
|-----------|-------|-------------|
| Skills | 50 | Workflow orchestrators (features, bugs, audits, git, docs, infra) |
| Agents | 8 | Read-only reviewers + utility subagents |
| Instructions | 9 | Behavioral rules loaded every session (caveman, subagent-orchestration, guardrails, auto-context, memory-save-rules, sleep-short, harden-types, simplify, deep-thinker) |
| Plugins | 2 | Guardrails (bash safety) + **Ponytail** (lazy senior dev / YAGNI code-writing ruleset) |
| Commands | 8 | `/recall`, `/remember` + 6 Ponytail commands (`/ponytail`, `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt`, `/ponytail-gain`, `/ponytail-help`) |
| Config | 1 | `opencode.jsonc` + `AGENTS.md` + `~/.config/ponytail/config.json` |
| Wrapper | 1 | Auto-starts AgentMemory before OpenCode |
| Setup script | 1 | Fully automated installation from scratch |
| Ponytail submodule | 1 | Pinned git submodule at `ponytail/`, vendored to `~/.config/opencode/ponytail/` on install |

## Quick Start (Full Setup)

If you have a fresh machine:

```bash
git clone --recurse-submodules https://github.com/Acauhi99/opencode-agent-system.git
cd opencode-agent-system
bash scripts/setup.sh
```

If you forgot `--recurse-submodules`, the setup script auto-runs `git submodule update --init` for you.

This installs everything: Node.js, OpenCode binary, MCP servers, LSP servers, config files, skills, agents, the wrapper script, and the Ponytail plugin.

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

# Ponytail (lazy senior dev mode) — auto-active at level `full`
/ponytail                       # show current level
/ponytail lite|full|ultra|off   # switch intensity mid-session
/ponytail-review                # over-engineering review of the current diff
/ponytail-audit                 # over-engineering audit of the whole repo
/ponytail-debt                  # harvest `ponytail:` shortcut comments
/ponytail-gain                  # show the benchmark scoreboard
```

## Ponytail (Lazy Senior Dev Mode)

Ponytail is a YAGNI-driven code-writing ruleset. The plugin injects the ruleset into every turn's system prompt — no need to invoke it manually. It governs what the agent builds, while `caveman-always` (an instruction, still active) governs how the agent talks.

**Pair is intentional** — the two solve different problems and stack cleanly:
- `caveman-always.md` → terse prose, drop filler
- `ponytail` (plugin) → minimal code, "stop at the first rung that holds"

Default mode is `full`. Change with `~/.config/ponytail/config.json` (key: `defaultMode` = `lite` | `full` | `ultra` | `off`) or env `PONYTAIL_DEFAULT_MODE`. Per-session switch: `/ponytail <level>`. The plugin vendors itself to `~/.config/opencode/ponytail/` and symlinks its 6 commands into `~/.config/opencode/commands/`.

Source: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) (pinned to v4.8.0 in this package).

## Project Structure

```
opencode-agent-system/
├── cli/
│   └── index.js              # CLI: init, list, uninstall, setup
├── agents/                   # 8 subagent definitions (.md)
├── skills/                   # 50 skill directories (SKILL.md each)
├── ponytail/                 # git submodule @ v4.8.0 (lazy senior dev mode)
│   ├── .opencode/
│   │   ├── plugins/ponytail.mjs
│   │   └── command/          # 6 ponytail commands
│   ├── skills/               # 6 ponytail skills
│   └── hooks/                # ruleset + config builder
├── config/                   # OpenCode config backup
│   ├── opencode.jsonc        # Main config (MCP, permissions, plugins)
│   ├── AGENTS.md             # CodeGraph usage guide
│   ├── instructions/         # 9 behavioral instruction files
│   ├── plugins/              # 1 TypeScript plugin (guardrails)
│   └── commands/             # 8 custom commands (recall + remember + 6 ponytail)
├── scripts/                  # Setup automation
│   ├── setup.sh              # Full install script (init submodules + copy)
│   ├── opencode-wrapper      # Wrapper that auto-starts AgentMemory
│   └── requirements.txt      # Global npm packages list
├── .gitmodules               # ponytail submodule reference
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

Bundles [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) as a git submodule (v4.8.0) for the lazy senior dev / YAGNI code-writing ruleset.
