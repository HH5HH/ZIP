#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_path="${1:-ziptool_distro.zip}"
package_root="zip-chrome-extension"
archive_root_name="ziptool_distro"
staging_dir="$(mktemp -d "${TMPDIR:-/tmp}/ziptool-distro.XXXXXX")"

cleanup() {
  rm -rf "$staging_dir"
}

trap cleanup EXIT

if [[ "$output_path" != /* ]]; then
  output_path="$repo_root/$output_path"
fi

output_name="$(basename "$output_path")"

cd "$repo_root"

while IFS= read -r -d '' existing_zip; do
  [[ "$(basename "$existing_zip")" == "$output_name" ]] && continue
  rm -f "$existing_zip"
done < <(find "$repo_root" -maxdepth 1 -type f \( -name '*.zip' -o -name '*.ZIP' \) -print0)

rm -f "$output_path"

git checkout-index --all --force --prefix="$staging_dir/"

while IFS= read -r -d '' tracked_file; do
  worktree_path="$repo_root/$tracked_file"
  staged_path="$staging_dir/$tracked_file"
  if [[ -f "$worktree_path" || -L "$worktree_path" ]]; then
    mkdir -p "$(dirname "$staged_path")"
    cp -p "$worktree_path" "$staged_path"
  fi
done < <(git ls-files -z -- "$package_root")

if [[ ! -d "$staging_dir/$package_root" ]]; then
  echo "No extension files available to package." >&2
  exit 1
fi

rm -rf \
  "$staging_dir/$package_root/docs" \
  "$staging_dir/$package_root/scripts" \
  "$staging_dir/$package_root/tests"
rm -f "$staging_dir/$package_root/README.md"

find "$staging_dir/$package_root" \( -name '*.zip' -o -name '*.ZIP' -o -name '.DS_Store' \) -delete

rm -rf "$staging_dir/$archive_root_name"
mv "$staging_dir/$package_root" "$staging_dir/$archive_root_name"

if [[ -z "$(find "$staging_dir/$archive_root_name" -mindepth 1 -print -quit)" ]]; then
  echo "No extension files available to package." >&2
  exit 1
fi

(
  cd "$staging_dir"
  zip -q -r -9 "$output_path" "$archive_root_name"
)

printf '%s\n' "$output_path"
