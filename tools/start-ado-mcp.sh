#!/bin/sh
# VS Code starts MCP servers without the PATH of an interactive shell, so Node installed via nvm is not found.

if ! command -v npx >/dev/null 2>&1; then
  NVM_SCRIPT="${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  if [ -s "$NVM_SCRIPT" ]; then
    # shellcheck disable=SC1090
    . "$NVM_SCRIPT" >/dev/null 2>&1
  fi
fi

exec npx -y @azure-devops/mcp "$@"
