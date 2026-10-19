# Social Focus
Intentional Instagram and TikTok browsing: messages, profiles and creation without consumption feeds.

**ENGINEERING READY — DEVICE VALIDATION PENDING. Physical iPhone installation, Safari filtering and authenticated workflows remain unverified.**
Original Instagram/TikTok iPhone apps are outside our control. Protection applies only inside the Social Focus browser or enabled browser extensions.

Source and builds live on GitHub. No backend, analytics, subscription, permanent Windows development folder, or paid signing required by the project.

## Install
- Desktop: download the Chromium ZIP from a passing [Actions run](../../actions), extract, open `chrome://extensions` or `edge://extensions`, enable Developer mode, choose Load unpacked and select the extracted directory containing manifest.json.
- iPhone: the **UNSIGNED** IPA must be signed on your Windows computer/device using AltStore Classic. Downloading it does not install it. See [Windows installation and refresh](docs/INSTALL.md).
- Safari: separate experimental target/package; personal signing, permissions and actual filtering remain pending physical-device validation. See [feasibility](docs/FEASIBILITY.md).

[Passing engineering evidence](docs/EVIDENCE.md) records actual tests, source SHA and artifact links.

## Evidence and maintenance
[Feature matrix](docs/ACCEPTANCE.md) · [Progress](PROGRESS.md) · [Architecture](docs/ARCHITECTURE.md) · [Feasibility](docs/FEASIBILITY.md) · [Rule maintenance](docs/MAINTENANCE.md) · [Third-party audit](THIRD_PARTY_NOTICES.md).
CI publishes tests, source commit, checksums and unsigned device packages. Test fixtures do not establish live-site compatibility. Messaging and posting require platform login and explicit human acceptance; no real messages/posts are sent by CI.

## Develop in a temporary cloud checkout
Node 22: `npm ci`, `npm run check`, `npm test`, `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:browser`.
macOS: `python3 scripts/project.py`, then `bash scripts/ios.sh`. No Metro or development server is used in the iPhone release.

Protection is voluntary: disabling/uninstalling the extension, using an unprotected browser/native app, or changing feature controls bypasses it. Unknown platform routes are conservatively blocked; platform changes can break preserved functions. This is an initial engineering build, not a guarantee of compatibility.
