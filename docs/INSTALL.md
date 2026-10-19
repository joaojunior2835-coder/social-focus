> **HISTORICAL / SUPERSEDED.** This file concerns the stopped browser product. It does not demonstrate the revised original-native-app requirement. Follow [the native feasibility decision](NATIVE_APP_FEASIBILITY.md). No browser-product installation or device validation is requested.

# Windows → iPhone install and refresh
Verified against official sources on 2026-10-20; actual device procedure remains pending.

1. Download artifacts from a **passing** GitHub Actions run. Read SOURCE_COMMIT.txt and compare SHA256SUMS. On Windows use `Get-FileHash -Algorithm SHA256 <file>`.
2. Follow https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows . Install current stable AltServer from https://altstore.io/ and Apple iTunes/iCloud as directed there (direct Apple versions; follow official troubleshooting for Store-version constraints). No project development tools/folder required.
3. Connect unlocked iPhone by USB, trust this computer, enable Wi-Fi sync in iTunes, then use AltServer's tray menu to Install AltStore. Authenticate **only in the installer** with your own Apple Account, handling Apple challenges directly. Never paste credentials, certificates, profiles or pairing records into GitHub/chat.
4. Trust your developer identity under Settings → General → VPN & Device Management (wording varies). On iOS 16+ enable Settings → Privacy & Security → Developer Mode, restart and confirm.
5. Transfer `SocialFocus-Browser-UNSIGNED.ipa` to Files on iPhone. In AltStore Classic → My Apps → +, select the IPA. Let AltStore sign it. An unsigned IPA cannot be installed directly. Open Social Focus. No Metro/development server is needed.
6. Verify the test cases in ACCEPTANCE.md. Login directly in the platform web page. Persistent WKWebsiteDataStore should keep sessions; actual restart/refresh behavior is pending tests. Do not delete the app merely to refresh it, as uninstalling can remove session data.
7. Before seven days expire, keep AltServer running on Windows and iPhone reachable via USB or same Wi-Fi; open My Apps → Refresh All. Verify the expiry date advances and login survives. Background refresh is opportunistic; do not rely on it. If AltStore expires, follow official AltServer recovery and reinstall AltStore without deleting it first. Then refresh Social Focus. Record exact tool/iOS versions and result.
8. Optional Safari trial: install `SocialFocus-Safari-UNSIGNED.ipa`, retain its Safari extension if asked. This is a separate app, additional app slot/ID use. Enable in Settings → Apps → Safari → Extensions (older iOS: Settings → Safari → Extensions), grant Instagram/TikTok website access and test separately. Do not call it protected until those tests pass. If signing fails, browser-only installation remains independent; Safari is still unmet.

Source pages: FEASIBILITY.md. New AltStore remote-server refresh exists, but this guide deliberately uses the documented local Windows route without adding VPN/pairing dependencies. No refresh-time session preservation guarantee is made until measured.

## Desktop
Extract Chromium ZIP; retain that installed extension directory (a browser installation, not a development checkout). Load unpacked in Chromium Developer mode. Use the extension popup for direct inbox/profile/upload destinations and feature settings. Upgrades: extract new ZIP and use Reload on the extension card. Extension settings are local and private. People lookup accepts an account handle, not a recommendation feed.
