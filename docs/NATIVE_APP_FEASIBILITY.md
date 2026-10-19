# Native iPhone selective-blocking feasibility — NO-GO

Verified: **2026-10-20**, Europe/Berlin. Decision applies to the revised scope and constraints, not to all conceivable research techniques or future iOS APIs.

## Decision
**NO-GO. Stop product development.** No reviewed supported mechanism meets the combined requirement: prevent consumption in selected sections of the original Instagram and TikTok iPhone apps while preserving native DMs, ordinary profiles/settings, and posting with previews, on standard iOS with public APIs and no paid Developer membership or additional spending.

This is an evidence-based engineering decision, not a claim that a completed native blocker exists. No native proof of concept passed. Missing tools or an unavailable phone are not the reasons for this decision. The decisive gaps are API granularity, unsupported free provisioning for privileged candidates, and failure of the reviewed implementations to provide the specified native-iPhone behavior.

## Requirement being evaluated
Use the already-installed official Instagram/TikTok applications. Instagram: deny Reels, Stories and Explore. TikTok: deny For You, Following, other consumption destinations and Stories. Keep useful native functions and posting/previews usable. Restrictions must survive reopening. Whole-app shields, browser replacements, Android accessibility services, reminders, initial DM deep links, modified binaries and blanket video blocking are expressly rejected.

## Candidate mechanism matrix
| Candidate | Documented capability / permissions | Why it fails this exact scope | Result |
|---|---|---|---|
| Ordinary separately signed iOS app | Its own sandbox; public inter-app services only | No general permission to edit or intercept another native app's internal navigation/UI | Not a supported section blocker |
| Screen Time / FamilyControls selection | App, category and web-domain tokens; owner/guardian authorization and Family Controls entitlement | No Reels/Stories/Explore/native-tab token | Reject |
| ManagedSettings shields | Covers selected applications, web domains or categories with a shield | Shielding Instagram also obstructs its useful native UI; shield customization does not add tab-level policies | Whole-app substitute, rejected |
| DeviceActivity | Scheduled monitoring and usage thresholds for apps/categories/domains | No documented native-section event; cannot tell Reel time from DM time within the same app | Reject |
| UIAccessibility / VoiceOver-style approach | Developers expose accessibility descriptions and actions for their own UI; iOS supplies assistive services | No documented Android-like third-party AccessibilityService allowing persistent cross-app section enforcement | Reject public-API route |
| XCTest / UI automation | Developer UI testing can drive interactions; test environment required | Driving a UI is not a persistent section-access policy. Inspected iCTRL additionally uses private APIs and a developer test runner | Inspected implementation violates constraints |
| Shortcuts / deep links / Focus | App-open/app-close triggers, supported actions and notification controls | Opening DMs does not prevent subsequent feed navigation; no documented trigger for entering every native Reel/Story/Explore destination | Reject |
| Guided Access | Free built-in single-app sessions; manually disabled screen regions | Geometric touch masks are not semantic destination rules. No demonstrated protection of every alternate entry point while preserving dynamic DM/profile/posting screens across both apps and reopen | Not a qualifying reliable proof |
| DNS / conventional VPN or flow filtering | Domain/connection policies; custom NE/VPN providers require capabilities | No native-section identity from a hostname. No verified section-specific rules preserving all required functions; broad video/network blocks are rejected | Reject as an established solution |
| iOS 26+ Network Extension URL Filter | Full-URL filtering for WebKit/URLSession; other stacks require voluntary participation; provider entitlement and PIR configuration | Free Personal Teams lack Network Extensions capability. A URL dataset also does not itself establish section separation, coverage of the official apps' stacks, cached content prevention or upload/DM preservation | Fails current constraints; no POC justified |
| ReplayKit + on-device image recognition | User-approved capture/broadcast and image analysis | Observation does not grant a public API to deny individual destinations in another app. Adding a reminder or whole-app shield fails the required behavior | Reject |
| Platform cooperation / native settings | Only features supplied by Instagram/TikTok themselves or explicit supported integrations | No reviewed official control/API establishes the complete requested per-section deny policy on both apps. Recommendation controls are not equivalent to a ban on consumption | No qualifying candidate established |

The Guided Access and DNS rows are engineering assessments of documented primitives, not physical-device experiments. No claim is made that every possible DNS rule has been experimentally disproven, or that all test automation intrinsically requires private APIs.

## Apple evidence

**Sandbox boundary.** Apple documents separation between third-party apps and allows access to other apps only through explicitly provided services. This supports rejecting a generic helper app that rewrites another application's native screens. It does not rule out specific privileged services; those were reviewed separately. [Runtime security](https://support.apple.com/guide/security/security-of-runtime-process-sec15bfe098e/web).

**Screen Time granularity.** FamilyControls' picker/selectors concern applications, categories and web domains. ShieldSettings exposes corresponding shield targets. DeviceActivityEvent records usage of those objects over time. These documented selectors contain no native Instagram/TikTok subsection identity. Shield configuration can customize the shield's presentation, not rewrite the target application's views. [FamilyControls](https://developer.apple.com/documentation/familycontrols), [ShieldSettings](https://developer.apple.com/documentation/managedsettings/shieldsettings), [DeviceActivityEvent](https://developer.apple.com/documentation/deviceactivity/deviceactivityevent).

**Provisioning is a separate hard constraint.** Apple's current iOS capability table marks Family Controls development available to ADP, with the free Apple Developer column empty; Network extensions and Personal VPN also have no free-account support. The actual HTML checkmark cells were inspected because plain-text extraction drops their icons. The extracted three-row matrix is saved beside this report. An App Store distribution entitlement request is an additional process; avoiding the App Store does not grant a free provisioning entitlement. [Supported iOS capabilities](https://developer.apple.com/help/account/reference/supported-capabilities-ios), [Family Controls entitlement process](https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement).

**Newer URL filtering was explicitly considered.** It would be inaccurate to say that all modern iOS network filters see only hostnames. Apple's iOS 26 URL-filter mechanism can evaluate full URLs for supported networking paths. Apple also explains the requirement for cooperation from other networking stacks and a PIR-backed configuration. Its official sample configures a URL dataset, not a policy for social-app sections. No inspection of private account traffic or assertion about the current proprietary apps' networking internals was made. [URL filters](https://developer.apple.com/documentation/networkextension/url-filters), [official sample](https://developer.apple.com/documentation/networkextension/filtering-traffic-by-url), [WWDC25 explanation](https://developer.apple.com/videos/play/wwdc2025/234/).

The sample ZIP was downloaded from Apple's own documentation asset host and inspected without running it. Both the app and extension entitlement files declare `com.apple.developer.networking.networkextension` with `url-filter-provider`. That links this candidate directly to the unsupported free capability above. The sample requires iOS/Xcode 26 or newer; it does not demonstrate selective blocking in Instagram or TikTok. A paid membership alone would still not prove the functional requirement.

**Accessibility and automation.** UIAccessibility documents exposing an app's own controls to assistive technologies. XCUIAutomation documents a UI testing environment. Neither documentation establishes a consumer-installed background policy service that reliably denies native sections in unrelated apps. Shortcuts' app trigger observes opening/closing an application. Guided Access provides manual region restrictions within a single-app session. These facts do not establish the required semantic enforcement. [UIAccessibility](https://developer.apple.com/documentation/uikit/uiaccessibility-protocol), [XCUIAutomation](https://developer.apple.com/documentation/xcuiautomation), [Shortcuts triggers](https://support.apple.com/guide/shortcuts/setting-triggers-apde31e9638b/ios), [Guided Access](https://support.apple.com/en-ie/guide/iphone/iph7fad0d10/ios), [ReplayKit](https://developer.apple.com/documentation/replaykit).

## SocialLite: iPhone claim checked specifically
SocialLite's iPhone page says social platforms are used **inside SocialLite**, while original applications are blocked. Post Mode temporarily unlocks native applications for five minutes. Its FAQ explicitly limits its original-Instagram Reels-blocking claim to Android. That is replacement-app use plus whole-app restriction/unlock on iPhone, not the revised accepted experience. [iPhone page](https://sociallite.app/for-apple/), [FAQ](https://sociallite.app/faq/).

These are the vendor's descriptions, not independent physical testing or a source audit of its closed iOS application. The exact embedded rendering engine was not established, and no App Store listing or marketing screenshot was treated as proof of native selective blocking. No SocialLite code was imported or installed.

## Credible implementation source inspected

1. **kingstinct/react-native-device-activity**, commit `ae6099656281cfde1bfada5cae500b14f944995f`. Inspected `ios/Shared.swift`, the ShieldConfiguration extension and `config-plugin/withEntitlements.js` under `packages/react-native-device-activity/`. Its assignments use `store.shield.applications`, application categories and web domains; its plugin sets Family Controls and App Groups. This corroborates app/domain shielding, not native tab access control. [Pinned source](https://github.com/kingstinct/react-native-device-activity/tree/ae6099656281cfde1bfada5cae500b14f944995f).
2. **OpenMinis/iCTRL**, commit `874f528759b1b977971a06cc4a3594d169eb77b9`. Inspected README, `iCTRLUITests/ForegroundApp.m` and `iCTRLCompat/XCTCompatShim.m`. Its README describes private APIs and a long-lived test runner; ForegroundApp declares private `XCAXClient_iOS` and `LSApplicationWorkspace` interfaces. Its free-signing claim therefore does not make it a compliant public-API solution. It was not installed or run. [Pinned source](https://github.com/OpenMinis/iCTRL/tree/874f528759b1b977971a06cc4a3594d169eb77b9).
3. **Apple SimpleURLFilter sample**, ZIP SHA-256 `f77eb013b334790a6e42c44f529170119588d2c90f9cc97a7b44d6519cd310d2`. Inspected both entitlement files. [Official ZIP](https://docs-assets.developer.apple.com/published/ab6517c07cf8/FilteringTrafficByURL.zip). Inspection details are saved in `docs/evidence/native-url-sample.json`.

No third-party implementation code was copied into the product. Source inspection is not a claim that these projects were tested on a phone or that their advertised functionality was independently verified.

## Proof and acceptance status
| Required proof | Result |
|---|---|
| Official native Instagram/TikTok being selectively protected | Not demonstrated |
| Targeted sections cannot be consumed, including alternate entry points | Not demonstrated |
| DMs/profiles/settings remain usable under that native restriction | Not demonstrated |
| Native posting and required upload previews preserved | Not demonstrated |
| Restrictions survive reopening | Not demonstrated |
| Supported free installation/provisioning for a qualifying method | No qualifying candidate established |
| Physical-device acceptance | Unperformed; explicitly pending, not evidence of impossibility |

No native POC was implemented because the reviewed candidates fail prerequisite scope or supported free-capability requirements. Asking for a phone model or login would not resolve those prerequisite failures, so no device action or credentials are requested. The historical browser tests, simulator launch and unsigned IPAs prove none of this native acceptance matrix.

## Exact unmet requirement and stop condition
The unmet requirement is **supported, reliable per-section access denial inside both original iPhone apps, with useful native workflows preserved, within the free/public-API constraints**. The review is complete with a NO-GO; the app is not complete. Stop code generation and browser development. Reconsider only after specific new evidence of a supported compliant mechanism, such as an applicable platform-provided control or explicit official-app cooperation—not a renamed browser, generic network blocker, or paid entitlement proposal.

All linked sources were checked on the verification date above. The repository and historical commits/artifacts are retained. Project build workflows are disabled; no new repository, paid service, app modification or account authentication was performed for this review.
