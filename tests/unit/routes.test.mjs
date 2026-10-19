import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classify,
  decide,
  defaults,
  settings,
  platform,
} from "../../dist/core/routes.mjs";
const ig = "https://www.instagram.com",
  tt = "https://www.tiktok.com";
const blockedIG = [
  "/",
  "/?variant=following",
  "/reels/",
  "/reel/abc/",
  "/alice/reel/abc/",
  "/stories/alice/1/",
  "/stories/highlights/1/",
  "/explore/",
  "/explore/tags/a/",
  "/share/reel/abc",
  "/direct/reel/abc",
  "/new/unknown/layout",
  "/tv/123/",
];
const blockedTT = [
  "/",
  "/foryou",
  "/following",
  "/friends",
  "/explore",
  "/discover",
  "/search?q=cat",
  "/@alice/video/123",
  "/@alice/photo/123",
  "/@alice/story/12",
  "/stories/abc",
  "/live",
  "/en/foryou",
  "/pt-BR/@alice/video/123",
  "/v/123",
  "/t/abc",
  "/Zshort/",
];
for (const [site, paths] of [
  [ig, blockedIG],
  [tt, blockedTT],
])
  for (const path of paths)
    test("blocks " + site + path, () =>
      assert.equal(classify(site + path).blocked, true),
    );
const allowedIG = [
  "/direct/inbox/",
  "/direct/t/123/",
  "/accounts/login/",
  "/accounts/edit/",
  "/accounts/onetap/",
  "/accounts/switch/",
  "/alice/",
  "/alice/tagged/",
  "/create/select/",
  "/upload/",
  "/p/abc/",
  "/challenge/",
];
const allowedTT = [
  "/messages",
  "/messages/123",
  "/@alice",
  "/settings",
  "/login",
  "/signup",
  "/upload",
  "/tiktokstudio/upload",
  "/en/messages",
  "/pt-BR/@alice",
];
for (const [site, paths] of [
  [ig, allowedIG],
  [tt, allowedTT],
])
  for (const path of paths)
    test("allows " + site + path, () =>
      assert.equal(classify(site + path).blocked, false),
    );
test("every feature-toggle combination keeps utility routes isolated", () => {
  for (let bits = 0; bits < 16; bits++) {
    const s = Object.fromEntries(
      Object.keys(defaults).map((k, i) => [k, Boolean(bits & (1 << i))]),
    );
    for (const [path, key] of [
      ["/", "feeds"],
      ["/reel/id", "reels"],
      ["/stories/a/id", "stories"],
      ["/explore", "explore"],
    ])
      assert.equal(classify(ig + path, s).blocked, s[key]);
    for (const path of ["/messages", "/upload", "/@alice"])
      assert.equal(classify(tt + path, s).blocked, false);
    assert.equal(classify(tt + "/new/route", s).blocked, true);
  }
});
test("malformed, schemes, encoding, credentials and unrelated hosts", () => {
  for (const raw of [
    "::::",
    "javascript:alert(1)",
    "https://user:pass@instagram.com/direct/inbox",
    "https://instagram.com/%zz",
    "https://instagram.com/%2572eel/abc",
    "https://instagram.com/%00x",
  ])
    assert.equal(classify(raw).blocked, true, raw);
  assert.equal(
    classify("https://instagram.com.evil.example/reel/a").platform,
    "external",
  );
  assert.equal(platform("WWW.INSTAGRAM.COM"), "instagram");
  assert.equal(classify("/reel/a", defaults, ig).blocked, true);
  assert.equal(classify(ig + "/%72eel/abc").blocked, true);
});
test("safe settings validation and diagnostics contain no user input", () => {
  assert.deepEqual(
    settings({
      feeds: false,
      reels: "false",
      stories: null,
      password: "secret",
    }),
    { ...defaults, feeds: false },
  );
  assert.deepEqual(settings(null), defaults);
  const result = classify(tt + "/messages/SECRET?q=PRIVATE");
  assert.ok(!JSON.stringify(result).includes("SECRET"));
  assert.ok(!JSON.stringify(result).includes("PRIVATE"));
});
test("pure classifier works without URL global for native JavaScriptCore", () => {
  assert.equal(decide("www.tiktok.com", "/en/@alice/video/id").blocked, true);
  assert.equal(decide("instagram.com", "/direct/inbox/").blocked, false);
});
