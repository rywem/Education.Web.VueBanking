#!/usr/bin/env bash
# Renames this template to a new project name. See rename.ps1 for the Windows
# equivalent and full notes. Run ONCE on a fresh copy, before `npm install`.
#
# Usage: ./rename.sh OrderPortal
#
# NOTE (macOS): BSD sed needs `-i ''` instead of GNU's `-i`. If you're on macOS,
# either install gnu-sed (`brew install gnu-sed`, then use `gsed`) or change the
# `sed -i` calls below to `sed -i ''`.

set -euo pipefail

NEW="${1:-}"
if [[ -z "$NEW" ]]; then
  echo "Usage: ./rename.sh NewProjectName   (PascalCase, e.g. OrderPortal)"
  exit 1
fi

KEBAB=$(echo "$NEW" | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]')
TITLE=$(echo "$NEW" | sed -E 's/([a-z0-9])([A-Z])/\1 \2/g')

echo "Renaming:"
echo "  AppTemplate    -> $NEW"
echo "  app-template   -> $KEBAB"
echo "  'App Template' -> '$TITLE'"

PRUNE=( -path ./client/node_modules -o -path ./server/bin -o -path ./server/obj \
        -o -path ./client/dist -o -path ./.git -o -name rename.sh -o -name rename.ps1 )

# 1) Replace file contents (text files only; -I makes grep skip binaries).
find . \( "${PRUNE[@]}" \) -prune -o -type f -print0 |
while IFS= read -r -d '' f; do
  if grep -Iq -e 'App Template' -e 'AppTemplate' -e 'app-template' "$f"; then
    sed -i \
      -e "s/App Template/$TITLE/g" \
      -e "s/AppTemplate/$NEW/g" \
      -e "s/app-template/$KEBAB/g" \
      "$f"
  fi
done

# 2) Rename files whose name contains the token (.sln, .csproj).
find . -depth \( -path ./client/node_modules -o -path ./server/bin -o -path ./server/obj \) \
  -prune -o -name '*AppTemplate*' -print |
while read -r f; do
  nf=$(echo "$f" | sed "s/AppTemplate/$NEW/g")
  mv "$f" "$nf"
done

echo ""
echo "Done. Next: cd client && npm install, then open the folder in VS Code."
