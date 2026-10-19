import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import {transformSync} from "esbuild";
const refs = [
  ["liamperritt/opensocials", "ac16dcb23adb2dc7407ccee12f546a5cea4ef2de"],
  ["malekwael229/FocusTube", "f26d4181698e3ea709059ad2f49e65ec11d800de"],
];
const get = async (repo, sha, file) => {
  const r = await fetch(
    `https://raw.githubusercontent.com/${repo}/${sha}/${file}`,
  );
  if (!r.ok) throw Error("Reference source fetch failed");
  return r.text();
};
const [o, os] = refs[0],
  [f, fsSha] = refs[1];
const app = await get(o, os, "App.tsx"),
  config = await get(o, os, "Config.ts"),
  tt = await get(f, fsSha, "content-tt.js"),
  ig = await get(f, fsSha, "content-ig.js");
const sandbox = { Site: { isTT: () => false }, Utils: {} };
vm.createContext(sandbox);
vm.runInContext(tt + ";globalThis.subject=TikTok;", sandbox);
const probes = [];
for (const p of ["/", "/foryou", "/en/following", "/@test/video/1"]) {
  assert.equal(sandbox.subject.isBlockablePath(p), true);
  probes.push({ reference: "FocusTube", path: p, blocked: true });
}
assert.equal(sandbox.subject.isSafePage("/messages/123"), true);
probes.push({
  reference: "FocusTube",
  path: "/@test/story/1",
  blocked: sandbox.subject.isBlockablePath("/@test/story/1"),
  finding: "Story path requires additional coverage in our core.",
});

const matcher=app.match(/function urlMatchesRule\([\s\S]*?\n\}/)[0];
const openSandbox={module:{exports:{}}};vm.createContext(openSandbox);
vm.runInContext(transformSync(config,{loader:'ts',format:'cjs'}).code,openSandbox);
vm.runInContext(transformSync(matcher+';globalThis.matchRule=urlMatchesRule;',{loader:'ts',format:'iife'}).code,openSandbox);
const igConfig=openSandbox.module.exports.default.instagram;
const matches=(url,rules)=>rules.some(rule=>openSandbox.matchRule(url,rule));
assert.equal(matches('https://www.instagram.com/stories/test/1/',igConfig.defaultRedirects.stories),true);
probes.push({reference:'OpenSocials',storyRedirect:true,individualReelMatchedByReelsRedirect:matches('https://www.instagram.com/reel/test/',igConfig.defaultRedirects.reels),finding:'Pinned upstream route functions executed; our core adds independent direct-Reel coverage.'});

assert.ok(app.includes("setInterval("));
assert.ok(ig.includes("getReelPermalinkArticle"));
probes.push({
  reference: "OpenSocials",
  finding:
    "Source contains Stories redirect, persistent WebView session logic and timer-based selector injection; no live behavior assumed.",
});
fs.mkdirSync("evidence", { recursive: true });
fs.writeFileSync(
  "evidence/references.json",
  JSON.stringify({ references: refs, probes, liveTested: false }, null, 2),
);
