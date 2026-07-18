#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
template="$project_dir/deploy/vidselector.service"
target_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
target="$target_dir/vidselector.service"

if [[ ! -f "$project_dir/.next/BUILD_ID" ]]; then
  echo "Kein Produktions-Build gefunden. Führe zuerst 'npm run build' aus." >&2
  exit 1
fi

mkdir -p "$target_dir"
escaped_project_dir="${project_dir//\\/\\\\}"
escaped_project_dir="${escaped_project_dir//&/\\&}"
escaped_project_dir="${escaped_project_dir//|/\\|}"
sed "s|@VIDSELECTOR_DIR@|$escaped_project_dir|g" "$template" > "$target"

systemctl --user daemon-reload
systemctl --user enable --now vidselector.service

echo "VidSelector läuft auf diesem Gerät unter http://localhost:3000"
echo "Im Heimnetz erreichst du VidSelector unter http://<LAN-IP-dieses-PCs>:3000"
