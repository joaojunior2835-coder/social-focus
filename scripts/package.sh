#!/bin/bash
set -euo pipefail
mkdir -p evidence dist/delivery
printf '%s\n' "$GITHUB_SHA" > dist/delivery/SOURCE_COMMIT.txt
(cd dist/chromium && zip -qr ../delivery/SocialFocus-Chromium.zip .)
cp docs/INSTALL.md dist/delivery/INSTALL.md
cp docs/ACCEPTANCE.md dist/delivery/ACCEPTANCE.md
cp LICENSE THIRD_PARTY_NOTICES.md dist/delivery/
npm ls --all --json > evidence/dependencies.json
npm audit --json > evidence/npm-audit.json || true
(cd dist/delivery && sha256sum SocialFocus-Chromium.zip > SHA256SUMS)
