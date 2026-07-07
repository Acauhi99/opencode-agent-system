# Auto-Context

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
