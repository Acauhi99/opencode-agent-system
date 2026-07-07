---
name: project-context
description: Check for context.md at repo root on first contact with a project. If missing, analyze repo and generate one. Provides persistent project context across sessions. Trigger: when starting work on a project for the first time in a session.
license: MIT
compatibility: opencode
---

When starting work on a project, check if `context.md` exists at the repo root.

- If it exists: read it. It holds project-specific context (stack, commands, conventions).
- If it doesn't exist: analyze the repo and generate one.

## How to generate

Look for:
- `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` / `Gemfile` — stack + deps
- `Makefile` / `justfile` / `Taskfile` — build/test/lint commands
- `tsconfig.json` / `.eslintrc*` / `prettier.config*` — tooling config
- `docker-compose*.yml` / `Dockerfile` — infrastructure
- `.github/workflows/*` — CI/CD
- `src/` / `app/` / `lib/` structure — project layout
- Existing `README.md` — conventions already documented

## What to include

```markdown
# context.md

## Stack
- Language: ...
- Framework: ...
- Database: ...
- Infra: ...

## Commands
- build: ...
- dev: ...
- test: ...
- lint: ...
- typecheck: ...

## Structure
- src/ — main code
- ...

## Conventions
- ...

## Gotchas
- ...
```

Ask the user to confirm before writing. One file, one question.
