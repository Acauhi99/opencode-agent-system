#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# OpenCode Agent System - Setup Script
# Fully automated installation of the complete OpenCode environment
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
OPENCODE_CONFIG_DIR="$HOME/.config/opencode"
OPENCODE_BIN_DIR="$HOME/.opencode/bin"
LOCAL_BIN_DIR="$HOME/.local/bin"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { printf "${BLUE}[info]${NC}  %s\n" "$1"; }
ok()    { printf "${GREEN}[ok]${NC}    %s\n" "$1"; }
warn()  { printf "${YELLOW}[warn]${NC}  %s\n" "$1"; }
err()   { printf "${RED}[error]${NC} %s\n" "$1"; }

# =============================================================================
# 1. Detect OS
# =============================================================================
detect_os() {
  case "$(uname -s)" in
    Linux*)  OS="linux";;
    Darwin*) OS="macos";;
    *)       err "Unsupported OS: $(uname -s)"; exit 1;;
  esac
  info "Detected OS: $OS"
}

# =============================================================================
# 2. Install nvm + Node.js
# =============================================================================
install_node() {
  if command -v node &>/dev/null; then
    local node_version
    node_version=$(node --version | sed 's/v//' | cut -d. -f1)
    if (( node_version >= 18 )); then
      ok "Node.js $(node --version) already installed"
      return
    fi
    warn "Node.js v$(node --version) is too old (need >= 18)"
  fi

  info "Installing nvm + Node.js 24.x..."
  export NVM_DIR="$HOME/.nvm"
  if [[ ! -d "$NVM_DIR" ]]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  fi
  # shellcheck source=/dev/null
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 24
  nvm use 24
  ok "Node.js $(node --version) installed"
}

# =============================================================================
# 3. Install OpenCode binary
# =============================================================================
install_opencode() {
  if [[ -x "$OPENCODE_BIN_DIR/opencode" ]]; then
    ok "OpenCode binary already installed at $OPENCODE_BIN_DIR/opencode"
    return
  fi

  info "Installing OpenCode binary..."
  mkdir -p "$OPENCODE_BIN_DIR"

  # Download latest OpenCode release
  local arch
  arch=$(uname -m)
  case "$arch" in
    x86_64)  arch="x64";;
    aarch64) arch="arm64";;
    arm64)   arch="arm64";;
    *)       err "Unsupported architecture: $arch"; exit 1;;
  esac

  local platform
  case "$OS" in
    linux)  platform="linux";;
    macos)  platform="darwin";;
  esac

  local download_url="https://github.com/anomalyco/opencode/releases/latest/download/opencode-${platform}-${arch}"
  info "Downloading from: $download_url"
  curl -fsSL "$download_url" -o "$OPENCODE_BIN_DIR/opencode"
  chmod +x "$OPENCODE_BIN_DIR/opencode"
  ok "OpenCode binary installed"
}

# =============================================================================
# 4. Install global npm packages
# =============================================================================
install_npm_packages() {
  info "Installing global npm packages..."
  while IFS= read -r line; do
    [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
    local pkg="$line"
    if npm list -g "$pkg" &>/dev/null; then
      ok "Already installed: $pkg"
    else
      info "Installing: $pkg"
      npm install -g "$pkg"
      ok "Installed: $pkg"
    fi
  done < "$SCRIPT_DIR/requirements.txt"
}

# =============================================================================
# 4b. Initialize git submodules (Ponytail)
# =============================================================================
init_submodules() {
  if [[ -f "$REPO_DIR/.gitmodules" ]]; then
    info "Initializing git submodules..."
    (cd "$REPO_DIR" && git submodule update --init --recursive)
    ok "Submodules initialized"
  fi
}

# =============================================================================
# 5. Copy config files
# =============================================================================
copy_config() {
  info "Copying OpenCode config files..."
  mkdir -p "$OPENCODE_CONFIG_DIR"
  mkdir -p "$OPENCODE_CONFIG_DIR/instructions"
  mkdir -p "$OPENCODE_CONFIG_DIR/plugin"
  mkdir -p "$OPENCODE_CONFIG_DIR/commands"
  mkdir -p "$OPENCODE_CONFIG_DIR/skills"
  mkdir -p "$OPENCODE_CONFIG_DIR/agents"
  mkdir -p "$OPENCODE_CONFIG_DIR/ponytail"

  # Main config
  cp "$REPO_DIR/config/opencode.jsonc" "$OPENCODE_CONFIG_DIR/opencode.jsonc"
  ok "Copied opencode.jsonc"

  # AGENTS.md (global)
  cp "$REPO_DIR/config/AGENTS.md" "$OPENCODE_CONFIG_DIR/AGENTS.md"
  ok "Copied AGENTS.md"

  # Instructions
  for f in "$REPO_DIR/config/instructions/"*.md; do
    cp "$f" "$OPENCODE_CONFIG_DIR/instructions/"
  done
  ok "Copied $(ls "$REPO_DIR/config/instructions/"*.md | wc -l) instruction files"

  # Plugins
  for f in "$REPO_DIR/config/plugins/"*.ts; do
    cp "$f" "$OPENCODE_CONFIG_DIR/plugin/"
  done
  ok "Copied $(ls "$REPO_DIR/config/plugins/"*.ts | wc -l) plugin files"

  # Commands
  for f in "$REPO_DIR/config/commands/"*.md; do
    cp "$f" "$OPENCODE_CONFIG_DIR/commands/"
  done
  ok "Copied $(ls "$REPO_DIR/config/commands/"*.md | wc -l) command files"

  # Ponytail (git submodule at repo root, vendored into ~/.config/opencode/ponytail/)
  if [[ -d "$REPO_DIR/ponytail" && -f "$REPO_DIR/ponytail/.opencode/plugins/ponytail.mjs" ]]; then
    cp -r "$REPO_DIR/ponytail/." "$OPENCODE_CONFIG_DIR/ponytail/"
    ok "Copied ponytail (lazy senior dev mode)"

    # Symlink 6 ponytail commands
    for f in "$REPO_DIR/ponytail/.opencode/command/"ponytail*.md; do
      [[ -f "$f" ]] || continue
      ln -sf "$OPENCODE_CONFIG_DIR/ponytail/.opencode/command/$(basename "$f")" \
             "$OPENCODE_CONFIG_DIR/commands/$(basename "$f")"
    done
    ok "Symlinked 6 ponytail commands"

    # Ponytail default-mode config (~/.config/ponytail/config.json)
    mkdir -p "$HOME/.config/ponytail"
    if [[ ! -f "$HOME/.config/ponytail/config.json" ]]; then
      printf '{\n  "defaultMode": "full"\n}\n' > "$HOME/.config/ponytail/config.json"
      ok "Created ~/.config/ponytail/config.json (defaultMode: full)"
    fi
  else
    warn "ponytail/ submodule not initialized; run 'git submodule update --init' and re-run setup"
  fi

  # Skills
  cp -r "$REPO_DIR/skills/"* "$OPENCODE_CONFIG_DIR/skills/"
  ok "Copied $(ls "$REPO_DIR/skills/" | wc -l) skills"

  # Agents
  cp -r "$REPO_DIR/agents/"* "$OPENCODE_CONFIG_DIR/agents/"
  ok "Copied $(ls "$REPO_DIR/agents/" | wc -l) agents"
}

# =============================================================================
# 6. Install wrapper script
# =============================================================================
install_wrapper() {
  info "Installing OpenCode wrapper script..."
  mkdir -p "$LOCAL_BIN_DIR"
  cp "$SCRIPT_DIR/opencode-wrapper" "$LOCAL_BIN_DIR/opencode"
  chmod +x "$LOCAL_BIN_DIR/opencode"
  ok "Wrapper installed at $LOCAL_BIN_DIR/opencode"

  # Check if ~/.local/bin is in PATH
  case ":$PATH:" in
    *":$LOCAL_BIN_DIR:"*) ok "$LOCAL_BIN_DIR already in PATH";;
    *) warn "$LOCAL_BIN_DIR not in PATH. Add to your shell profile:";;
  esac
}

# =============================================================================
# 7. Verify installation
# =============================================================================
verify() {
  info "Verifying installation..."

  local errors=0

  # Check node
  if command -v node &>/dev/null; then
    ok "Node.js: $(node --version)"
  else
    err "Node.js not found"; (( errors++ ))
  fi

  # Check npm
  if command -v npm &>/dev/null; then
    ok "npm: $(npm --version)"
  else
    err "npm not found"; (( errors++ ))
  fi

  # Check opencode binary
  if [[ -x "$OPENCODE_BIN_DIR/opencode" ]]; then
    ok "OpenCode binary: $OPENCODE_BIN_DIR/opencode"
  else
    err "OpenCode binary not found"; (( errors++ ))
  fi

  # Check wrapper
  if [[ -x "$LOCAL_BIN_DIR/opencode" ]]; then
    ok "Wrapper: $LOCAL_BIN_DIR/opencode"
  else
    err "Wrapper not found"; (( errors++ ))
  fi

  # Check config
  if [[ -f "$OPENCODE_CONFIG_DIR/opencode.jsonc" ]]; then
    ok "Config: $OPENCODE_CONFIG_DIR/opencode.jsonc"
  else
    err "Config not found"; (( errors++ ))
  fi

  # Check skills count
  local skill_count
  skill_count=$(ls "$OPENCODE_CONFIG_DIR/skills/" 2>/dev/null | wc -l)
  if (( skill_count == 43 )); then
    ok "Skills: $skill_count/43"
  else
    warn "Skills: $skill_count/43 (expected 43)"
  fi

  # Check agents count
  local agent_count
  agent_count=$(ls "$OPENCODE_CONFIG_DIR/agents/" 2>/dev/null | wc -l)
  if (( agent_count == 16 )); then
    ok "Agents: $agent_count/16"
  else
    warn "Agents: $agent_count/16 (expected 16)"
  fi

  # Check Ponytail
  if [[ -f "$OPENCODE_CONFIG_DIR/ponytail/.opencode/plugins/ponytail.mjs" ]]; then
    ok "Ponytail: vendored at $OPENCODE_CONFIG_DIR/ponytail/"
  else
    warn "Ponytail: not installed (run: git submodule update --init && bash scripts/setup.sh)"
  fi
  local pt_cmd_count
  pt_cmd_count=$(ls "$OPENCODE_CONFIG_DIR/commands/ponytail"*.md 2>/dev/null | wc -l)
  if (( pt_cmd_count == 6 )); then
    ok "Ponytail commands: $pt_cmd_count/6"
  else
    warn "Ponytail commands: $pt_cmd_count/6"
  fi

  # Check global npm packages
  local packages=(
    "@agentmemory/agentmemory"
    "@agentmemory/mcp"
    "@colbymchenry/codegraph"
    "typescript-language-server"
    "bash-language-server"
    "pyright"
  )
  for pkg in "${packages[@]}"; do
    if npm list -g "$pkg" &>/dev/null; then
      ok "Package: $pkg"
    else
      warn "Package not installed: $pkg"
    fi
  done

  echo ""
  if (( errors == 0 )); then
    ok "Installation complete! Run 'opencode' to start."
  else
    err "Installation completed with $errors error(s). Check above."
  fi
}

# =============================================================================
# Main
# =============================================================================
main() {
  echo "============================================"
  echo " OpenCode Agent System - Setup"
  echo "============================================"
  echo ""

  detect_os
  install_node
  install_opencode
  install_npm_packages
  init_submodules
  copy_config
  install_wrapper
  verify
}

main "$@"
