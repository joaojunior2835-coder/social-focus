# Acceptance ledger
Status: IN PROGRESS. See Actions evidence artifacts for exact source SHA, environment/browser versions, executable test results and public live checks. Do not extrapolate from a passing fixture to the live service.

| Capability | Desktop fixtures | Live authenticated | iPhone browser | iPhone Safari |
|---|---|---|---|---|
| Instagram home/Reels/Stories/Explore/direct links | Executable suite | Pending | Pending | Pending |
| TikTok feeds/video/photo/Stories/direct/short links | Executable suite | Pending | Pending | Pending |
| SPA, back/forward, refresh, inserted overlays | Executable suite | Pending | Pending | Pending |
| Profiles and account-handle lookup | Fixture route/UI | Pending | Pending | Pending |
| DMs/settings/account switching | Route preservation fixtures only | Pending real workflows | Pending | Pending |
| Upload selection/preview | Synthetic local draft fixture | Pending supported web workflow | Pending | Pending |
| Posting and actual delivery of DMs | Not sent | Requires explicit approval | Pending | Pending |
| Login/session persistence | Not established by fixtures | Pending | Pending restart/refresh | Pending |
| Device target build | CI | N/A | See actual run | Separate target CI |
| Free signing/install | N/A | N/A | Pending | Pending/unproven |

## Physical acceptance (must use real phone)
Record source SHA, IPA checksum, iPhone model, iOS version, AltServer/AltStore versions, date and result. Do not commit personal screenshots.
1. Install browser-only IPA by free signing; launch with Windows dev tools closed/no development server.
2. Login to both platforms normally; quit/relaunch app and phone; confirm session persistence.
3. Attempt all blocked destinations including a link inside a DM/profile, localized URLs and short links. No consumption or audio should occur.
4. Navigate DMs, profiles, settings and account switching. Do not send a real message without separate approval.
5. Open supported web creation; select a harmless local file, preview, cancel. Do not publish without explicit approval.
6. Test network loss, reconnect, back/forward and reload. Confirm blocked routes stay blocked after changed-layout conditions.
7. Refresh before expiry; verify new expiry and preserved session. Record recovery behavior after expiration if feasible.
8. Separately install Safari package, retain extension, enable permissions for both sites, and repeat filtering/navigation/draft tests in real iPhone Safari. WebKit/Chromium fixtures are not Safari extension tests.

Native applications remain unfiltered. If a platform requires its native app, any external handoff is deliberately user-confirmed and explicitly unfiltered.
