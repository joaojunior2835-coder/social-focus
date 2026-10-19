> **HISTORICAL / SUPERSEDED.** This file concerns the stopped browser product. It does not demonstrate the revised original-native-app requirement. Follow [the native feasibility decision](NATIVE_APP_FEASIBILITY.md). No browser-product installation or device validation is requested.

# Engineering evidence — 2026-10-20
Status: ENGINEERING READY — DEVICE VALIDATION PENDING. This is not completion.

Tested source: `f11ece4a5cd6cf3e00b843861afccb72d41189fe`. [Full passing CI run](https://github.com/joaojunior2835-coder/social-focus/actions/runs/39336275940).

- 56 unit tests passed, including all 16 feature-setting combinations.
- 10 automated browser tests passed in Chromium 141.0.7390.37; actual MV3 extension loaded for fixture and public-site checks. The standalone-runtime test measures observer batching/idleness and duplicate initialization.
- Real synthetic WebM selection, decoding and playback tested in an upload route and an unchanged Instagram inbox-route draft fixture; unrelated media stayed hidden.
- Native JavaScriptCore bridge: 8 assertions passed.
- Both release device targets built with Xcode 16.4 / iPhoneOS 18.5; package checks assert ARM64 Mach-O iOS-device platform, bundled engine and referenced Safari files. Both IPAs are unsigned and require personal signing.
- Release app installed/launched in iPhone 16 simulator (com.apple.CoreSimulator.SimRuntime.iOS-18-5); process remained running without any project development server. This is NOT physical-iPhone installation or a Safari extension test.
- Public unauthenticated direct-video destinations on Instagram and TikTok returned HTTP 200 and displayed the route gate. Instagram login navigation was unavailable in the runner. No live authenticated messaging, posting, account switching or login-session claim is established.
- Dependency audit: zero known vulnerabilities at this run. Full pinned dependency inventory and reports are in the artifact.

## Actual artifacts
- [iPhone-UNSIGNED-and-evidence-f11ece4a5cd6cf3e00b843861afccb72d41189fe](https://github.com/joaojunior2835-coder/social-focus/actions/runs/39336275940/artifacts/12227026692)
- [Chromium-and-evidence-f11ece4a5cd6cf3e00b843861afccb72d41189fe](https://github.com/joaojunior2835-coder/social-focus/actions/runs/39336275940/artifacts/12226489017)

Actions artifacts expire after one day to control storage. A draft engineering release retains installation artifacts; it is not a signed iPhone release.

## Remaining acceptance gates
- [Physical iPhone/free signing/refresh and authenticated browser workflows](../../issues/1).
- [Separate Safari signing/permissions/filtering](../../issues/2). Its free-install compatibility remains unproven and is an unmet requirement until tested or explicitly scoped by the user.

Original Instagram and TikTok native apps remain unfiltered. Account-handle lookup is available; full people-search compatibility is not claimed. Website selectors can drift. The software is voluntary and can be bypassed by disabling it or changing filters.
