import { build } from "esbuild";
import fs from "node:fs";
fs.mkdirSync("dist/chromium", { recursive: true });
fs.mkdirSync("dist/core", { recursive: true });
fs.mkdirSync("apps/ios/Generated", { recursive: true });
await build({
  entryPoints: ["packages/filtering-core/routes.ts"],
  outfile: "dist/core/routes.mjs",
  bundle: true,
  format: "esm",
  target: "es2022",
});
await build({
  entryPoints: ["packages/filtering-core/routes.ts"],
  outfile: "apps/ios/Generated/core.js",
  bundle: true,
  format: "iife",
  globalName: "SocialFocusCore",
  target: "es2020",
});
await build({
  entryPoints: ["packages/filtering-core/runtime.ts"],
  outfile: "dist/chromium/content.js",
  bundle: true,
  format: "iife",
  target: "es2020",
});
fs.cpSync("extensions/chromium", "dist/chromium", { recursive: true });
fs.copyFileSync("dist/chromium/content.js", "apps/ios/Generated/content.js");
fs.copyFileSync(
  "extensions/chromium/navigation.js",
  "apps/ios/Generated/navigation.js",
);
fs.copyFileSync(
  "extensions/chromium/start.css",
  "apps/ios/Generated/start.css",
);
fs.cpSync("dist/chromium", "dist/safari", { recursive: true });
const manifest = JSON.parse(
  fs.readFileSync("extensions/chromium/manifest.json", "utf8"),
);
// Safari page-world support is separate from Chromium; device acceptance must verify it.
manifest.content_scripts[0].world = "MAIN";
delete manifest.background;
fs.writeFileSync(
  "dist/safari/manifest.json",
  JSON.stringify(manifest, null, 2),
);
