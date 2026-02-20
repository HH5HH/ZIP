#!/usr/bin/env bash
set -euo pipefail

# Patches cached @adobe/spectrum-design-data-mcp installs so fallback loaders
# use installed dependency paths instead of nonexistent monorepo paths.
#
# tokens.js:
#   ../../../../packages/tokens/src
#   -> ../../../spectrum-tokens/src
#
# schemas.js:
#   ../../../../packages/component-schemas/schemas
#   -> ../../../spectrum-component-api-schemas/schemas

NPX_ROOT="${HOME}/.npm/_npx"

if [[ ! -d "${NPX_ROOT}" ]]; then
  echo "No npx cache found at ${NPX_ROOT}"
  exit 0
fi

patched=0
while IFS= read -r data_dir; do
  tokens_file="${data_dir}/tokens.js"
  schemas_file="${data_dir}/schemas.js"

  if [[ -f "${tokens_file}" ]]; then
    perl -0pi -e 's#\.\./\.\./\.\./\.\./packages/tokens/src#../../../spectrum-tokens/src#g' "${tokens_file}"
  fi

  if [[ -f "${schemas_file}" ]]; then
    perl -0pi -e 's#\.\./\.\./\.\./\.\./packages/component-schemas/schemas#../../../spectrum-component-api-schemas/schemas#g' "${schemas_file}"
  fi

  if rg -q '\.\./\.\./\.\./spectrum-tokens/src' "${tokens_file}" && rg -q '\.\./\.\./\.\./spectrum-component-api-schemas/schemas' "${schemas_file}"; then
    patched=$((patched + 1))
    echo "Patched MCP fallback paths in: ${data_dir}"
  fi
done < <(find "${NPX_ROOT}" -type d -path "*/node_modules/@adobe/spectrum-design-data-mcp/src/data" 2>/dev/null)

if [[ "${patched}" -eq 0 ]]; then
  echo "No cached spectrum-design-data-mcp data loaders were patched."
  exit 1
fi

echo "Done. Patched loader directories: ${patched}"
