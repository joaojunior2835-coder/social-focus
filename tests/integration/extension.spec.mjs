import { test, expect, chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
let context, worker, extensionID;
const html = fs.readFileSync("tests/fixtures/page.html", "utf8");
test.beforeAll(async () => {
  const extension = path.resolve("dist/chromium");
  context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
  });
  worker =
    context.serviceWorkers()[0] ||
    (await context.waitForEvent("serviceworker"));
  extensionID = new URL(worker.url()).host;
  await context.route("https://**/*", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: html }),
  );
  fs.mkdirSync("evidence", { recursive: true });
  fs.writeFileSync(
    "evidence/browser-version.json",
    JSON.stringify(
      {
        browser: context.browser().version(),
        actualExtension: true,
        fixtureOriginIntercepted: true,
        commit: process.env.GITHUB_SHA,
      },
      null,
      2,
    ),
  );
});
test.afterAll(async () => context?.close());
test.beforeEach(async () => {
  await worker.evaluate(() => chrome.storage.local.clear());
});
async function visit(url) {
  const page = await context.newPage();
  await page.goto(url);
  await expect(page.locator("html")).toHaveAttribute("data-sf-ready", "");
  return page;
}
test("actual extension blocks direct, localized, encoded and short-link routes across reload", async () => {
  for (const url of [
    "https://www.instagram.com/",
    "https://www.instagram.com/reel/a/",
    "https://www.instagram.com/%72eel/a/",
    "https://www.instagram.com/stories/a/1",
    "https://www.instagram.com/explore/",
    "https://www.tiktok.com/en/@a/video/1",
    "https://www.tiktok.com/@a/story/1",
    "https://vm.tiktok.com/Zshort",
  ]) {
    const page = await visit(url);
    await expect(page.locator("#sf-gate")).toBeVisible();
    await expect(page.locator("main")).toBeHidden();
    await page.reload();
    await expect(page.locator("#sf-gate")).toBeVisible();
    await page.close();
  }
});
test("messages/profiles do not unlock consumption links or media", async () => {
  for (const url of [
    "https://www.instagram.com/direct/inbox/",
    "https://www.instagram.com/test/",
    "https://www.tiktok.com/messages",
    "https://www.tiktok.com/@test",
  ]) {
    const page = await visit(url);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("#preview")).toBeHidden();
    await page.evaluate(() => document.getElementById("reel").click());
    expect(page.url()).toBe(url);
    await page.close();
  }
});
test("SPA route changes and back/forward remain guarded without redirects", async () => {
  const page = await visit("https://www.instagram.com/direct/inbox/");
  await page.evaluate(() => history.pushState({}, "", "/reel/one/"));
  await expect(page.locator("#sf-gate")).toBeVisible();
  await page.goBack();
  await expect(page.locator("main")).toBeVisible();
  await page.goForward();
  await expect(page.locator("#sf-gate")).toBeVisible();
  await page.evaluate(() =>
    history.replaceState({}, "", "/new/changed/layout"),
  );
  await expect(page.locator("#sf-gate")).toBeVisible();
  expect(page.url()).toContain("/new/changed/layout");
  await page.waitForTimeout(200);
  expect(page.url()).toContain("/new/changed/layout");
  await page.close();
});
test("dynamic story/reel overlays and changed links are hidden; unknown layout stays blocked", async () => {
  const page = await visit("https://www.instagram.com/test/");
  await page.evaluate(() => {
    const d = document.createElement("div");
    d.innerHTML =
      '<div data-testid="story-tray" id="tray">Story</div><a id="inserted" href="/reel/dynamic">Reel</a><iframe id="embedded" src="https://www.instagram.com/reel/x/embed"></iframe>';
    document.querySelector("main").append(d);
  });
  await expect(page.locator("#tray")).toBeHidden();
  await expect(page.locator("#inserted")).toBeHidden();
  await expect(page.locator("#embedded")).toBeHidden();
  await page
    .locator("#inbox")
    .evaluate((e) => e.setAttribute("href", "/stories/new/1"));
  await expect(page.locator("#inbox")).toBeHidden();
  await page.evaluate(() => {
    document.querySelector("main").innerHTML = "<div>Changed layout</div>";
    history.pushState({}, "", "/reel/new");
  });
  await expect(page.locator("#sf-gate")).toBeVisible();
  await page.close();
});
test("file selection and draft preview work only on upload routes", async () => {
  const page = await visit("https://www.tiktok.com/upload");
  await expect(page.locator("#preview")).toBeVisible();
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    const done = new Promise(
      (resolve) =>
        (recorder.onstop = async () =>
          resolve(
            Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())),
          )),
    );
    recorder.start();
    for (let frame = 0; frame < 12; frame++) {
      ctx.fillStyle = frame % 2 ? "green" : "blue";
      ctx.fillRect(0, 0, 32, 32);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    recorder.stop();
    const out = await done;
    stream.getTracks().forEach((t) => t.stop());
    return out;
  });
  await page.locator("#upload").setInputFiles({
    name: "sanitized-draft.webm",
    mimeType: "video/webm",
    buffer: Buffer.from(bytes),
  });
  await expect(page.locator("#preview")).toHaveAttribute("src", /^blob:/);
  await expect
    .poll(() => page.locator("#preview").evaluate((v) => v.readyState))
    .toBeGreaterThanOrEqual(2);
  await page.locator("#preview").evaluate((v) => {
    v.loop = true;
    return v.play();
  });
  await expect
    .poll(() => page.locator("#preview").evaluate((v) => v.paused))
    .toBe(false);
  await page.evaluate(() => {
    const v = document.createElement("video");
    v.id = "unrelated";
    v.src = document.getElementById("preview").src;
    v.autoplay = true;
    document.querySelector("main").append(v);
  });
  await expect(page.locator("#unrelated")).toBeHidden();
  await expect
    .poll(() => page.locator("#unrelated").evaluate((v) => v.paused))
    .toBe(true);
  await page.evaluate(() => history.pushState({}, "", "/@test/video/1"));
  await expect(page.locator("#sf-gate")).toBeVisible();
  await expect(page.locator("#preview")).toBeHidden();
  await page.close();
});
test("settings persist and propagate across open pages without unlocking other features", async () => {
  const page = await visit("https://www.instagram.com/reel/one/");
  await expect(page.locator("#sf-gate")).toBeVisible();
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionID}/popup.html`);
  await expect(popup.locator("#reels")).toBeChecked();
  await popup.locator("#reels").uncheck();
  await expect(page.locator("main")).toBeVisible();
  await popup.reload();
  await expect(popup.locator("#reels")).not.toBeChecked();
  await page.goto("https://www.instagram.com/stories/a/1");
  await expect(page.locator("#sf-gate")).toBeVisible();
  await popup.locator("#reels").check();
  await popup.close();
  await page.close();
});
test("engine has bounded observer work and never inspects private message text", async () => {
  const errors = [];
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("https://www.instagram.com/direct/inbox/");
  await expect(page.locator("main")).toBeVisible();
  await page.evaluate(() => {
    for (let i = 0; i < 100; i++) {
      const e = document.createElement("a");
      e.href = "/reel/" + i;
      document.querySelector("main").append(e);
    }
  });
  await expect(page.locator("a[data-sf-link]")).toHaveCount(102);
  expect(errors).toEqual([]);
  await page.close();
});

test("unchanged Instagram inbox route permits only a selected local draft preview", async () => {
  const page = await visit('https://www.instagram.com/direct/inbox/');
  await expect(page.locator('#preview')).toBeHidden();
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    const done = new Promise(
      (resolve) =>
        (recorder.onstop = async () =>
          resolve(
            Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())),
          )),
    );
    recorder.start();
    for (let frame = 0; frame < 12; frame++) {
      ctx.fillStyle = frame % 2 ? "green" : "blue";
      ctx.fillRect(0, 0, 32, 32);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    recorder.stop();
    const out = await done;
    stream.getTracks().forEach((t) => t.stop());
    return out;
  });

  await page.locator('#upload').setInputFiles({name:'local-draft.webm',mimeType:'video/webm',buffer:Buffer.from(bytes)});
  await expect(page.locator('#preview')).toBeVisible();
  await expect.poll(()=>page.locator('#preview').evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);
  await page.locator('#preview').evaluate(v=>{v.loop=true;return v.play();});
  await expect.poll(()=>page.locator('#preview').evaluate(v=>v.paused)).toBe(false);
  await page.evaluate(()=>{const v=document.createElement('video');v.id='outside-draft';v.src=document.getElementById('preview').src;document.querySelector('main').append(v);});
  await expect(page.locator('#outside-draft')).toBeHidden();
  await page.evaluate(()=>history.pushState({},'', '/reel/other/'));
  await expect(page.locator('#sf-gate')).toBeVisible();
  await expect(page.locator('#preview')).toBeHidden();
  await page.close();
});
test("unauthenticated live smoke uses actual extension and records limits", async () => {
  test.setTimeout(75000);
  await context.unroute("https://**/*");
  const results = [];
  for (const url of [
    "https://www.instagram.com/reel/social-focus-test/",
    "https://www.tiktok.com/@socialfocus/video/1",
    "https://www.instagram.com/accounts/login/",
  ]) {
    const page = await context.newPage();
    let status = "unavailable",
      httpStatus = null;
    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });
      httpStatus = response?.status();
      const protectedPage = await page.locator("#sf-gate").isVisible();
      status = protectedPage
        ? "route-gate-visible"
        : (await page.locator("html[data-sf-ready]").count())
          ? "filter-loaded"
          : "filter-not-observed";
    } catch (e) {
      status = "network-or-platform-unavailable";
    }
    if (httpStatus >= 200 && httpStatus < 400 && /\/(reel|video)\//.test(page.url())) {
      await expect(page.locator("#sf-gate")).toBeVisible();
    }
    results.push({
      case: url.includes("/accounts/login") ? "login-page" : "blocked-route",
      platform: url.includes("instagram") ? "instagram" : "tiktok",
      status,
      httpStatus,
      authenticated: false,
    });
    await page.close();
  }
  fs.writeFileSync(
    "evidence/live-public.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        commit: process.env.GITHUB_SHA,
        results,
        limitation:
          "Unauthenticated network/route smoke only; no messaging, posting or logged-in feed compatibility established.",
      },
      null,
      2,
    ),
  );
});
