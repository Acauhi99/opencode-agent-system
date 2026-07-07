# Guardrails — Bash Permission Rules

These rules are enforced by the permission system. Know them before you run anything.

## deny = never run, no alternative exists

If a command is denied, DO NOT attempt it, rephrase it, or ask to override it.
The denial exists because the command is irreversible and has no legitimate use from an agent.

| Pattern | Why |
|---|---|
| `rm -rf /`, `rm -rf /*`, `rm -fr /`, `rm -fr /*` (+ sudo) | Destroys entire filesystem |
| `git reset --hard*`, `git clean -f*` | Destroys uncommitted work |
| `git push --force*`, `git push -f*` | Rewrites remote history, destroys others' work |
| `mkfs*`, `mke2fs*`, `fdisk*`, `parted*`, `sgdisk*`, `wipefs*` | Formats/destroys disks |
| `dd *of=/dev/*`, `shred /dev/*`, `blkdiscard /dev/*` | Raw disk destruction |
| `shutdown*`, `reboot*`, `poweroff*`, `halt*` (+ sudo) | Takes down the machine |
| `docker system prune*--volumes*`, `docker system prune*-a*` | Destroys all unused Docker data |
| `docker compose down *-v*`, `docker-compose down *-v*` | Destroys project volumes |
| `terraform destroy*`, `tofu destroy*`, `pulumi destroy*` | Destroys cloud infrastructure |
| `curl \| bash`, `curl \| sh`, `curl \| zsh`, `wget \| bash`, `wget \| sh` | Executes remote code without review |

**When denied:** Stop. Find an alternative approach or tell the user what you were trying to do.

## ask = dangerous, needs human approval

If a command requires approval, explain WHAT you're doing and WHY before the user sees the prompt.
Never batch multiple ask-worthy commands in one line.

| Pattern | Why it needs approval |
|---|---|
| `git push` | Pushes to remote, affects team |
| `git branch -D` | Deletes branch without merge verification |
| `docker volume rm*` | Destroys data volumes |
| `docker volume prune*` | Destroys all unused volumes |

**When ask:** State the command, its purpose, and what could go wrong. Then wait.

## allow = run freely

Everything not listed above. Use good judgment — just because you CAN doesn't mean you SHOULD.
