/* Builds the Portfolio Inspo page from links.json. */
(function () {
  /* Everything on the page (title + links) lives in GitHub:
     github.com/danielletorres-dev/portfolio-inspo — edit links.json there. */
  const BASE = "https://raw.githubusercontent.com/danielletorres-dev/portfolio-inspo/main/";

  async function init(root) {
  root.dataset.lwBusy = "1";
  let data;
  try {
    data = await (await fetch(BASE + "links.json", { cache: "no-cache" })).json();
  } catch (e) {
    root.innerHTML = "<p class=\"lw-desc\">Couldn\u2019t load links right now — try refreshing.</p>";
    delete root.dataset.lwBusy; return;
  }
  const TITLE = data.title || "";
  const TITLE_IMG = data.titleImage ? new URL(data.titleImage, BASE).href : "";
  const LINKS = data.links || [];
  if (!document.getElementById("lw-fonts")) {
    const l = document.createElement("link"); l.id = "lw-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,800&family=DM+Mono:wght@400;500&display=swap";
    document.head.appendChild(l);
  }

  const LABELS = { youtube: "YouTube", short: "YouTube", tiktok: "TikTok", instagram: "Instagram", threads: "Threads", website: "Website" };

  function parse(url) {
    let u; try { u = new URL(url); } catch (e) { return { kind: "website" }; }
    const h = u.hostname.replace(/^www\.|^m\./, ""), p = u.pathname;
    let m;
    if (h === "youtu.be") return { kind: "youtube", id: p.slice(1) };
    if (h.endsWith("youtube.com")) {
      if ((m = p.match(/^\/shorts\/([\w-]+)/))) return { kind: "short", id: m[1] };
      if (u.searchParams.get("v")) return { kind: "youtube", id: u.searchParams.get("v") };
      if ((m = p.match(/^\/(?:embed|live)\/([\w-]+)/))) return { kind: "youtube", id: m[1] };
    }
    if (h.endsWith("tiktok.com") && (m = p.match(/\/video\/(\d+)/))) return { kind: "tiktok", id: m[1] };
    if (h === "instagram.com" && (m = p.match(/^\/(p|reel|reels|tv)\/([\w-]+)/)))
      return { kind: "instagram", id: m[2], type: m[1] === "reels" ? "reel" : m[1] };
    if (/^threads\.(net|com)$/.test(h) && (m = p.match(/^\/(@[\w.]+)\/post\/([\w-]+)/)))
      return { kind: "threads", user: m[1], id: m[2] };
    return { kind: "website" };
  }

  const RATIO = { youtube: "16 / 9", short: "9 / 16", tiktok: "9 / 16" };

  function videoSrc(info) {
    if (info.kind === "tiktok")
      return `https://www.tiktok.com/player/v1/${info.id}?autoplay=1&muted=1&loop=1&controls=0&progress_bar=0&play_button=0&volume_control=0&fullscreen_button=0&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=0`;
    return `https://www.youtube-nocookie.com/embed/${info.id}?autoplay=1&mute=1&loop=1&playlist=${info.id}&controls=0&playsinline=1&rel=0&modestbranding=1&disablekb=1`;
  }

  function slug(url) {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname)
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  }
  function screenshot(url) {
    return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1440&viewport.height=900`;
  }

  function fmtDate(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function mediaHTML(item, info) {
    const label = LABELS[info.kind];
    const overlay = `<a class="lw-hit" href="${esc(item.url)}" target="_blank" rel="noopener" aria-label="Open on ${label}: ${esc(item.description || "")}"></a>
                     <span class="lw-badge">${label}</span><span class="lw-arrow" aria-hidden="true">↗</span>`;
    if (info.kind === "instagram") {
      const link = `https://www.instagram.com/${info.type}/${info.id}/?utm_source=ig_embed`;
      return `<div class="lw-media lw-native">
        <blockquote class="instagram-media" data-instgrm-permalink="${link}" data-instgrm-version="14">
          <a href="${link}" target="_blank" rel="noopener"><div class="lw-placeholder"></div></a>
        </blockquote></div>`;
    }
    if (info.kind === "threads") {
      const link = `https://www.threads.com/${info.user}/post/${info.id}`;
      return `<div class="lw-media lw-native">
        <blockquote class="text-post-media" data-text-post-permalink="${link}" data-text-post-version="0">
          <a href="${link}" target="_blank" rel="noopener"><div class="lw-placeholder"></div></a>
        </blockquote></div>`;
    }
    if (info.kind === "website") {
      return `<div class="lw-media"><img class="lw-loading" loading="lazy" alt="" src="${esc(item.image ? new URL(item.image, BASE).href : BASE + "screenshots/" + slug(item.url) + ".jpg")}" data-fallback="${esc(screenshot(item.url))}">${overlay}</div>`;
    }
    return `<div class="lw-media" style="aspect-ratio:${RATIO[info.kind]}">
      <iframe data-src="${esc(videoSrc(info))}" title="${label} video" tabindex="-1" aria-hidden="true"
        allow="autoplay; encrypted-media; picture-in-picture"></iframe>${overlay}</div>`;
  }

  const items = LINKS.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const allTags = [...new Set(items.flatMap(i => i.tags || []))].sort();
  const parsed = items.map(i => parse(i.url));

  root.innerHTML = `
    <h1 class="lw-title">${TITLE_IMG ? `<img src="${esc(TITLE_IMG)}" alt="${esc(TITLE)}">` : esc(TITLE)}</h1>
    <ul class="lw-filters" aria-label="Filter by tag">
      <li><button class="lw-chip" data-tag="" aria-pressed="true"><span>All</span></button></li>
      ${allTags.map(t => `<li><button class="lw-chip" data-tag="${esc(t)}" aria-pressed="false"><span>${esc(t)}</span></button></li>`).join("")}
    </ul>
    <div class="lw-grid">
      ${items.map((item, n) => `
        <article class="lw-card" data-tags="${esc((item.tags || []).join("|"))}">
          <div class="lw-inner">
            ${mediaHTML(item, parsed[n])}
            ${item.date ? `<time class="lw-date" datetime="${esc(item.date)}">${fmtDate(item.date)}</time>` : ""}
            ${item.description ? `<p class="lw-desc">${esc(item.description)}</p>` : ""}
            <ul class="lw-tags">
              ${(item.tags || []).map(t => `<li><button class="lw-chip" data-tag="${esc(t)}"><span>#${esc(t)}</span></button></li>`).join("")}
            </ul>
          </div>
        </article>`).join("")}
    </div>`;

  delete root.dataset.lwBusy;

  /* Masonry: size each card's row span to its content, and keep it right as embeds load */
  const grid = root.querySelector(".lw-grid");
  const ROW = 4;
  function fit(card) {
    const h = card.firstElementChild.getBoundingClientRect().height;
    card.style.gridRowEnd = `span ${Math.max(1, Math.ceil(h / ROW))}`;
  }
  const ro = new ResizeObserver(entries => entries.forEach(e => fit(e.target.parentElement)));
  grid.querySelectorAll(".lw-card").forEach(card => { ro.observe(card.firstElementChild); fit(card); });

  /* Website screenshot not taken yet? Use a live one until GitHub saves it */
  root.querySelectorAll("img[data-fallback]").forEach(img => img.addEventListener("error", () => {
    if (img.src !== img.dataset.fallback) img.src = img.dataset.fallback;
  }));

  root.querySelectorAll("img.lw-loading").forEach(img => {
    const done = () => img.classList.remove("lw-loading");
    img.complete ? done() : img.addEventListener("load", done, { once: true });
  });

  /* Videos: load when they scroll near, stop when they scroll away */
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      const f = e.target;
      if (e.isIntersecting) { if (!f.src || f.src === "about:blank") f.src = f.dataset.src; }
      else if (f.src && f.src !== "about:blank") f.src = "about:blank";
    }
  }, { rootMargin: "300px 0px" });
  root.querySelectorAll("iframe[data-src]").forEach(f => io.observe(f));

  /* Platform embed scripts, loaded only if needed */
  function loadScript(src, ready) {
    const s = document.createElement("script"); s.async = true; s.src = src; s.onload = ready; document.body.appendChild(s);
  }
  if (parsed.some(p => p.kind === "instagram")) {
    if (window.instgrm) window.instgrm.Embeds.process();
    else loadScript("https://www.instagram.com/embed.js", () => window.instgrm && window.instgrm.Embeds.process());
  }
  if (parsed.some(p => p.kind === "threads")) loadScript("https://www.threads.com/embed.js");

  /* Tag filtering */
  function setFilter(tag) {
    root.querySelectorAll(".lw-filters .lw-chip").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tag === tag)));
    root.querySelectorAll(".lw-card").forEach(c => { c.hidden = !!tag && !c.dataset.tags.split("|").includes(tag); });
  }
  root.addEventListener("click", e => {
    const b = e.target.closest(".lw-chip");
    if (!b) return;
    setFilter(b.dataset.tag);
    if (b.closest(".lw-card")) root.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  }

  /* Cargo loads pages without a full refresh, so watch for the placeholder to appear */
  function scan() {
    var r = document.getElementById("link-wall");
    if (r && !r.querySelector(".lw-grid") && !r.dataset.lwBusy) init(r);
  }
  scan();
  document.addEventListener("DOMContentLoaded", scan);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
