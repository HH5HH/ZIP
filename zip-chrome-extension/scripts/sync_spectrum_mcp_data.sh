#!/usr/bin/env bash
set -euo pipefail

# Repairs data paths expected by published Adobe MCP packages:
# 1) @adobe/spectrum-design-data-mcp fallback paths under ~/.npm/_npx/*/packages
# 2) @adobe/s2-docs-mcp docs directory at ~/Spectrum/spectrum-design-data/docs/s2-docs

NPX_ROOT="${HOME}/.npm/_npx"
S2_DOCS_TARGET="${HOME}/Spectrum/spectrum-design-data/docs/s2-docs"
S2_ARCHIVE_URL="https://codeload.github.com/adobe/spectrum-design-data/tar.gz/refs/heads/main"

mirror_design_data_into_npx_root() {
  local root="$1"
  local token_src="${root}/node_modules/@adobe/spectrum-tokens/src"
  local schema_src="${root}/node_modules/@adobe/spectrum-component-api-schemas/schemas"
  local token_dst="${root}/node_modules/packages/tokens/src"
  local schema_dst="${root}/node_modules/packages/component-schemas/schemas"

  if [[ ! -d "${token_src}" || ! -d "${schema_src}" ]]; then
    return 0
  fi

  mkdir -p "${token_dst}" "${schema_dst}/components" "${schema_dst}/types"
  cp -f "${token_src}"/*.json "${token_dst}/"
  cp -f "${schema_src}/components"/*.json "${schema_dst}/components/"
  cp -f "${schema_src}/types"/*.json "${schema_dst}/types/"

  echo "Mirrored MCP fallback data in: ${root}"
}

sync_s2_docs_snapshot() {
  local tmp_dir archive extract_root source_dir target_parent
  tmp_dir="$(mktemp -d)"
  archive="${tmp_dir}/spectrum-design-data-main.tgz"
  extract_root="${tmp_dir}/extract"
  source_dir="${extract_root}/spectrum-design-data-main/docs/s2-docs"
  target_parent="$(dirname "${S2_DOCS_TARGET}")"

  mkdir -p "${extract_root}" "${target_parent}"

  curl -sSL "${S2_ARCHIVE_URL}" -o "${archive}"
  tar -xzf "${archive}" -C "${extract_root}" "spectrum-design-data-main/docs/s2-docs"

  if [[ ! -d "${source_dir}" ]]; then
    echo "ERROR: expected docs/s2-docs not found in downloaded archive." >&2
    return 1
  fi

  rm -rf "${S2_DOCS_TARGET}"
  cp -R "${source_dir}" "${S2_DOCS_TARGET}"
  echo "Synced S2 docs to: ${S2_DOCS_TARGET}"
  rm -rf "${tmp_dir}"
}

main() {
  local found=0
  if [[ -d "${NPX_ROOT}" ]]; then
    while IFS= read -r mcp_dir; do
      found=1
      mirror_design_data_into_npx_root "$(cd "${mcp_dir}/../../.." && pwd)"
    done < <(find "${NPX_ROOT}" -type d -path "*/node_modules/@adobe/spectrum-design-data-mcp" 2>/dev/null)
  fi

  if [[ "${found}" -eq 0 ]]; then
    echo "No cached @adobe/spectrum-design-data-mcp installs were found under ${NPX_ROOT}."
  fi

  sync_s2_docs_snapshot
}

main "$@"
