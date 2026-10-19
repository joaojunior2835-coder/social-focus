# Feasibility — verified 2026-10-20
Documentation support is not an installation result. No physical phone has been tested.

| Surface | Documentation support | Implementation | Fixtures | Live | Physical device | Limits |
|---|---|---|---|---|---|---|
| Original Instagram iPhone app | No public selective UI control established | Unsupported | N/A | N/A | Not tested | Another app cannot edit its UI |
| Original TikTok iPhone app | No public selective UI control established | Unsupported | N/A | N/A | Not tested | Same sandbox limit |
| Own iPhone WKWebView browser | Public WebKit APIs; Personal Team provisioning documented | SwiftUI shell + injected shared core | Shared engine tests in CI | Pending | Pending signing/install | Platform web login/upload availability varies |
| iPhone Safari | Safari web extensions in containing iOS app documented | Separate experimental target | Shared engine only | Pending | Pending signing/permissions | Free Personal Team + AltStore extension combination unproven; unmet requirement until tested |
| Desktop Chromium | MV3 content scripts/document start documented | Extension | CI actual-extension tests | Unauthenticated checks in CI; authenticated pending | N/A | User can disable protection |

## Free installation gate
Apple documents Personal Teams: up to 10 App IDs, 3 devices, 3 installed apps; provisioning expires after seven days. Apple documents the Xcode route; AltStore documents a Windows signing/install route using your Apple Account locally. This establishes a documented candidate, not end-to-end verification of this project's IPA. AltStore itself uses a slot; embedded extensions may require additional IDs.
The browser-only app has no restricted capabilities. Safari has a separate containing app/package and no App Groups entitlement. Apple requires signing both iOS extension and containing app for device use. Official docs do not establish that this exact free-signing Safari combination works; retain it as an unmet requirement requiring device testing or an explicit scope decision if rejected.

Project minimum: iOS 16.0 (SwiftUI NavigationStack and Safari extension support); hardware must run that version or newer. User's exact iPhone model/iOS and AltStore/AltServer versions are unknown. Developer Mode is required on iOS 16+; trust the computer and developer identity. Latest iOS compatibility must be verified on the actual device, not inferred from deployment target. Basic release runs entirely from bundled resources.

Standard GitHub-hosted runners for public repositories are documented free. macos-15 is listed and its runner image lists Xcode 16.4 default with iPhoneOS SDK. CI records actual Xcode/SDK versions, uses no paid capacity and retains small artifacts for one day. Storage remains a separate allowance: no paid storage enabled; download promptly. If quota blocks uploads, build is not delivered until resolved within free limits.

## Official sources
- https://developer.apple.com/help/account/basics/about-your-developer-account — Personal Team limits and expiration.
- https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows — Windows Apple iTunes/iCloud, USB trust, AltServer, account auth, Developer Mode.
- https://faq.altstore.io/altstore-classic/your-altstore — IPA sideloading, expiry and refresh.
- https://faq.altstore.io/altstore-classic/altserver — local install/refresh and recovery.
- https://faq.altstore.io/altstore-classic/remote-altservers — newer optional remote refresh; not required here, no third-party pairing material uploaded by this project.
- https://developer.apple.com/documentation/safariservices/creating-a-safari-web-extension
- https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension
- https://developer.apple.com/documentation/safariservices/messaging-between-the-app-and-javascript-in-a-safari-web-extension — App Groups needed for shared containers, omitted here.
- https://support.apple.com/guide/security/security-of-runtime-process-sec15bfe098e/web — sandbox boundary.
- https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md

No Mac ownership, paid membership, TestFlight, signing subscription or backend is required by the selected candidate workflow. Actual signing/install remains an external acceptance gate. If it fails: first isolate browser-only IPA, inspect the local installer error (never upload credentials/profiles), update official AltServer/Apple drivers, and test local USB refresh; investigate a documented legitimate free signer only if needed. Do not pay or bypass security.
