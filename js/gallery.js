// ============ Instagram gallery (homepage preview + gallery page) ============
// Posts come from api/instagram.php (all posts synced from Instagram, or the
// backup list until an access token is added). On GitHub Pages, where PHP
// doesn't run, the sync job publishes the same data as api/instagram-feed.json;
// failing that, the backup list api/instagram-posts.json is read directly.
//
// Markup: <div id="igGrid" data-ig="preview|full"></div>
//   preview -> homepage: latest posts only (CSS shows 8 / 6 / 4 by screen size)
//   full    -> gallery page: every post, with filters + lightbox
(function () {
  const grid = document.getElementById("igGrid");
  if (!grid) return;
  const mode = grid.dataset.ig || "preview";
  const PREVIEW_TILES = 8;   // CSS hides some of these on smaller screens
  const PREVIEW_EMBEDS = 3;  // embeds are tall; fewer on the homepage

  const DEFAULT_ALT = "Maluba Blooms arrangement";

  let posts = [];

  const getJson = url => fetch(url, { headers: { Accept: "application/json" } })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });

  // Same conversion as manual_payload() in api/instagram.php.
  const fromBackupList = urls => ({
    source: "manual",
    posts: (Array.isArray(urls) ? urls : []).map(u => {
      const m = /\/(p|reel|tv)\/([A-Za-z0-9_-]+)/.exec(String(u));
      return m && { id: m[2], type: m[1] === "p" ? "image" : "video",
                    permalink: `https://www.instagram.com/${m[1]}/${m[2]}/` };
    }).filter(Boolean),
  });

  getJson("api/instagram.php")
    .catch(() => getJson("api/instagram-feed.json"))
    .catch(() => getJson("api/instagram-posts.json").then(fromBackupList))
    .then(data => {
      posts = (data.posts || []).filter(p => p.permalink || p.src);
      if (data.source !== "api") {
        const notice = document.getElementById("igSyncNotice");
        const message = document.getElementById("igSyncNoticeMessage");
        // Only shown on this computer (localhost), never to website visitors.
        const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
        if (notice && message && isLocal) {
          message.textContent = data.error
            ? "Automatic gallery sync is unavailable; showing saved posts."
            : "Automatic gallery sync isn't connected; showing saved posts.";
          notice.hidden = false;
        }
      }
      if (!posts.length) return showEmpty();
      if (data.source === "api") renderTiles(); else renderEmbeds();
    })
    .catch(showEmpty);

  function showEmpty() {
    // Homepage keeps its stock gallery; gallery page shows a message.
    const loading = document.getElementById("igLoading");
    if (loading) loading.hidden = true;
    const status = document.getElementById("igStatus");
    if (status) status.hidden = false;
  }

  function reveal() {
    grid.hidden = false;
    const stock = document.getElementById("stockGallery");
    if (stock) stock.hidden = true;
    const loading = document.getElementById("igLoading");
    if (loading) loading.hidden = true;
  }

  // ---------- Filters (gallery page) ----------
  const filterBar = document.getElementById("igFilters");
  let filter = "all";
  const matches = p =>
    filter === "all" ||
    (filter === "video" ? (p.type === "video" || p.has_video) : !(p.type === "video"));

  function setupFilters(onChange) {
    if (!filterBar) return;
    filterBar.hidden = false;
    const counts = {
      all: posts.length,
      video: posts.filter(p => p.type === "video" || p.has_video).length,
      image: posts.filter(p => p.type !== "video").length,
    };
    filterBar.querySelectorAll("[data-filter]").forEach(btn => {
      const c = btn.querySelector(".count");
      if (c) c.textContent = counts[btn.dataset.filter];
      btn.addEventListener("click", () => {
        filter = btn.dataset.filter;
        filterBar.querySelectorAll("[data-filter]").forEach(b =>
          b.setAttribute("aria-pressed", String(b === btn)));
        onChange();
      });
    });
  }

  // ---------- API mode: our own photo/video tiles ----------
  function renderTiles() {
    grid.className = "ig-tiles" + (mode === "preview" ? " ig-preview" : "");
    const draw = () => {
      const list = mode === "preview" ? posts.slice(0, PREVIEW_TILES) : posts.filter(matches);
      grid.innerHTML = list.map(p => {
        const alt = shortCaption(p.caption) || DEFAULT_ALT;
        return `<button type="button" class="ig-tile" data-id="${escapeAttr(p.id)}" aria-label="Open: ${escapeAttr(alt)}">
          <img src="${escapeAttr(p.src)}" alt="${escapeAttr(alt)}" loading="lazy" decoding="async">
        </button>`;
      }).join("");
      grid.querySelectorAll(".ig-tile").forEach(t =>
        t.addEventListener("click", () => openLightbox(list, list.findIndex(p => p.id === t.dataset.id))));
    };
    draw();
    if (mode === "full") setupFilters(draw);
    reveal();
  }

  // ---------- Backup mode: official Instagram embeds ----------
  function renderEmbeds() {
    grid.className = "ig-grid" + (mode === "preview" ? " ig-preview" : "");
    const draw = () => {
      const list = mode === "preview" ? posts.slice(0, PREVIEW_EMBEDS) : posts.filter(matches);
      grid.innerHTML = list.map(p =>
        `<div class="ig-item"><blockquote class="instagram-media" data-instgrm-permalink="${escapeAttr(p.permalink)}?utm_source=ig_embed" data-instgrm-version="14"><a href="${escapeAttr(p.permalink)}" target="_blank" rel="noopener">View this post on Instagram</a></blockquote></div>`
      ).join("");
      if (window.instgrm) window.instgrm.Embeds.process();
    };
    draw();
    if (mode === "full") setupFilters(draw);
    reveal();
    if (!window.instgrm) {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://www.instagram.com/embed.js";
      document.body.appendChild(s);
    }
  }

  // ---------- Lightbox ----------
  let lb, slides = [], index = 0;

  function buildLightbox() {
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Gallery viewer");
    lb.innerHTML = `
      <button class="lightbox__close" aria-label="Close">&times;</button>
      <button class="lightbox__nav lightbox__nav--prev" aria-label="Previous">&#8249;</button>
      <figure class="lightbox__stage"></figure>
      <button class="lightbox__nav lightbox__nav--next" aria-label="Next">&#8250;</button>
      <div class="lightbox__meta">
        <p class="lightbox__caption"></p>
        <div class="lightbox__row">
          <span class="lightbox__count"></span>
        </div>
      </div>`;
    document.body.appendChild(lb);
    lb.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
    lb.querySelector(".lightbox__nav--prev").addEventListener("click", () => go(-1));
    lb.querySelector(".lightbox__nav--next").addEventListener("click", () => go(1));
    lb.addEventListener("click", e => { if (e.target === lb) closeLightbox(); });
    document.addEventListener("keydown", e => {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    });
    let x0 = null;
    lb.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      x0 = null;
    });
  }

  function openLightbox(list, postIndex) {
    if (!lb) buildLightbox();
    // Flatten posts into slides so carousels can be swiped through too.
    slides = [];
    list.forEach((p, pi) => (p.items || [p]).forEach((item, ii) =>
      slides.push({ post: p, item, ii, total: (p.items || [p]).length, pi })));
    index = Math.max(0, slides.findIndex(s => s.pi === postIndex));
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    show();
    lb.querySelector(".lightbox__close").focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    lb.querySelector(".lightbox__stage").innerHTML = "";
    document.body.style.overflow = "";
  }

  function go(step) {
    index = (index + step + slides.length) % slides.length;
    show();
  }

  function show() {
    const { post, item, ii, total } = slides[index];
    const stage = lb.querySelector(".lightbox__stage");
    stage.innerHTML = "";
    let el;
    if (item.type === "video" && item.video) {
      el = document.createElement("video");
      el.src = item.video;
      el.poster = item.src;
      el.controls = true;
      el.autoplay = true;
      el.playsInline = true;
    } else {
      el = document.createElement("img");
      el.src = item.src;
      el.alt = shortCaption(post.caption) || DEFAULT_ALT;
    }
    stage.appendChild(el);
    lb.querySelector(".lightbox__caption").textContent = post.caption || "";
    lb.querySelector(".lightbox__count").textContent = total > 1 ? `${ii + 1} / ${total}` : formatDate(post.timestamp);
  }

  // ---------- Helpers ----------
  function shortCaption(c) {
    if (!c) return "";
    const line = c.split("\n")[0].trim();
    return line.length > 90 ? line.slice(0, 87) + "…" : line;
  }
  function formatDate(ts) {
    const d = ts ? new Date(ts) : null;
    return d && !isNaN(d) ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
  }
  function escapeAttr(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
})();
