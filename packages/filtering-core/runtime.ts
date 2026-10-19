import { classify, settings, defaults, version, type Settings } from "./routes";
declare global {
  interface Window {
    __socialFocus?: { update: (v: unknown) => void; diagnostics: () => object };
    __SF_SETTINGS__?: unknown;
    chrome?: any;
    browser?: any;
  }
}
if (!window.__socialFocus && classify(location.href).platform !== "external") {
  let config: Settings = settings(window.__SF_SETTINGS__),
    queued = false,
    scans = 0,
    blockedCount = 0;
  const style = document.createElement("style");
  style.id = "sf-style";
  const panel = document.createElement("aside");
  panel.id = "sf-gate";
  panel.setAttribute("role", "alert");
  const heading = document.createElement("h1");
  heading.textContent = "Keep your intention.";
  const text = document.createElement("p");
  text.textContent =
    "Social Focus blocked this destination. Messages, profiles and creation are available where the platform supports them.";
  panel.append(heading, text);
  const inbox = document.createElement("a");
  inbox.textContent = "Open messages";
  inbox.href =
    classify(location.href).platform === "instagram"
      ? "https://www.instagram.com/direct/inbox/"
      : "https://www.tiktok.com/messages";
  panel.append(inbox);
  const note = document.createElement("p");
  note.textContent =
    "Filtering active here. Live compatibility is not verified.";
  panel.append(note);
  const root = () => document.documentElement;
  const previewScope =
    'form:has(input[type="file"]),[role="dialog"]:has(input[type="file"]),[data-e2e="upload-stage"]:has(input[type="file"])';
  function isPreview(v: Element, d: ReturnType<typeof classify>) {
    const scope = v.closest(previewScope);
    if (!scope || d.blocked || v.closest("a[href]")) return false;
    const input = scope.querySelector<HTMLInputElement>('input[type="file"]');
    const source =
      (v as HTMLMediaElement).currentSrc || v.getAttribute("src") || "";
    const localDraft =
      /^(blob:|data:video\/)/.test(source) && !!input?.files?.length;
    return d.upload || localDraft;
  }
  function css(d: ReturnType<typeof classify>) {
    const selectors: string[] = [];
    if (config.reels)
      selectors.push(
        'a[href*="/reel/"]',
        'a[href*="/reels/"]',
        'a[href*="/video/"]',
        'a[href*="/photo/"]',
        '[data-e2e="recommend-list-item-container"]',
      );
    if (config.stories)
      selectors.push(
        'a[href*="/stories/"]',
        'a[href*="/story/"]',
        '[data-testid="story-tray"]',
        '[data-e2e*="story"]',
        '[aria-label="Stories"]',
        '[aria-label="Histórias"]',
        "a:has(canvas)",
        "button:has(canvas)",
        '[role="button"]:has(canvas)',
        '[data-testid*="story"]',
      );
    if (config.explore)
      selectors.push(
        'a[href^="/explore"]',
        'a[href^="/foryou"]',
        'a[href^="/following"]',
      );
    if (config.reels) {
      selectors.push(
        'iframe[src*="instagram.com"]',
        'iframe[src*="tiktok.com"]',
        "iframe[srcdoc]",
        'iframe[src^="blob:"]',
      );
      selectors.push("video:not([data-sf-preview])");
    }
    return `html[data-sf-blocked] body>:not(#sf-gate){display:none!important} #sf-gate{display:none!important} html[data-sf-blocked] #sf-gate{display:block!important;box-sizing:border-box;position:fixed;inset:0;overflow:auto;padding:12vh 8vw;background:#101c20;color:#f0f3ee;z-index:2147483647;font:18px/1.6 system-ui} #sf-gate a{color:#9be6c1} ${selectors.length ? selectors.join(",") + "{visibility:hidden!important;pointer-events:none!important}" : ""}`;
  }
  function run() {
    queued = false;
    const r = root();
    if (!r) return;
    const d = classify(location.href, config);
    scans++;
    if (!style.isConnected) r.append(style);
    const rules = css(d);
    if (style.textContent !== rules) style.textContent = rules;
    if (d.blocked) {
      if (!r.hasAttribute("data-sf-blocked")) {
        r.setAttribute("data-sf-blocked", "");
        blockedCount++;
      }
      if (document.body && !panel.isConnected) document.body.append(panel);
    } else if (r.hasAttribute("data-sf-blocked"))
      r.removeAttribute("data-sf-blocked");
    if (!r.hasAttribute("data-sf-ready")) r.setAttribute("data-sf-ready", "");
    // Read structural attributes only; never read message text or form values.
    for (const a of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      if (a.closest("#sf-gate")) continue;
      const block = classify(a.href, config).blocked;
      if (block && !a.hasAttribute("data-sf-link"))
        a.setAttribute("data-sf-link", "");
      else if (!block && a.hasAttribute("data-sf-link"))
        a.removeAttribute("data-sf-link");
    }
    for (const v of document.querySelectorAll<HTMLVideoElement>(
      "video,audio",
    )) {
      const preview = isPreview(v, d);
      if (preview && !v.hasAttribute("data-sf-preview"))
        v.setAttribute("data-sf-preview", "");
      else if (!preview && v.hasAttribute("data-sf-preview"))
        v.removeAttribute("data-sf-preview");
      if (d.blocked || (config.reels && !preview)) {
        if (!v.paused) v.pause();
        if (v.autoplay) v.autoplay = false;
      }
    }
  }
  function schedule() {
    if (!queued) {
      queued = true;
      queueMicrotask(run);
    }
  }
  const observer = new MutationObserver((records) => {
    if (
      records.some(
        (r) =>
          !(
            r.target === style ||
            style.contains(r.target) ||
            r.target === panel ||
            panel.contains(r.target)
          ),
      )
    )
      schedule();
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href", "src", "data-e2e", "data-testid", "aria-label"],
  });
  document.addEventListener("change", run, true);
  document.addEventListener(
    "click",
    (e) => {
      const a = (e.target as Element)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (a && classify(a.href, config).blocked) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
  document.addEventListener(
    "play",
    (e) => {
      const d = classify(location.href, config);
      if (d.blocked || (config.reels && !isPreview(e.target as Element, d)))
        (e.target as HTMLMediaElement).pause();
    },
    true,
  );
  for (const event of ["popstate", "pageshow", "hashchange", "sf-navigation"])
    window.addEventListener(event, run);
  window.__socialFocus = {
    update(v) {
      config = settings(v);
      run();
    },
    diagnostics: () => ({
      version,
      platform: classify(location.href).platform,
      reason: classify(location.href, config).reason,
      blocked: classify(location.href, config).blocked,
      scans,
      blockedCount,
    }),
  };
  const ext = window.browser || window.chrome;
  if (ext?.storage?.local) {
    ext.storage.local.get("filters", (v: any) =>
      window.__socialFocus?.update(v?.filters || defaults),
    );
    ext.storage.onChanged.addListener((c: any) => {
      if (c.filters) window.__socialFocus?.update(c.filters.newValue);
    });
  }
  run();
}
