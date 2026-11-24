// ============ Admin: stock control (admin.html) ============
// Lets the shop mark products in or out of stock. Out-of-stock products
// disappear from the price list, the photo page and customers' carts.
//
// HOW IT WORKS: the website is static (GitHub Pages), so there is no
// database. The stock list lives in data/stock.json in the GitHub
// repository. This page saves that file through GitHub's API using a
// personal access token that the admin pastes in; GitHub then republishes
// the site (about 1–2 minutes). The token stays in this browser only.
//
// TOKEN: GitHub > Settings > Developer settings > Personal access tokens >
// Fine-grained tokens > Generate. Repository access: only this repository.
// Permissions: Contents = Read and write. Nothing else.
const ADMIN = {
  repo: "David-Bwalya/Maluba-Blooms-",
  branch: "main",
  path: "data/stock.json",
};

(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const api = `https://api.github.com/repos/${ADMIN.repo}/contents/${ADMIN.path}`;
  const TOKEN_KEY = "maluba-admin-token";

  let token = "";
  let sha = "";              // current file version on GitHub (needed to update it)
  let saved = new Set();     // out-of-stock ids as saved on GitHub
  let current = new Set();   // out-of-stock ids as toggled on this page

  function status(text, kind) {
    const el = $("adminStatus");
    el.textContent = text;
    el.className = "admin-status" + (kind ? " admin-status--" + kind : "");
    el.hidden = !text;
  }

  // ---------- Token ----------
  try { token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || ""; } catch {}
  if (token) { $("tokenInput").value = token; $("rememberToken").checked = Boolean(localStorage.getItem(TOKEN_KEY)); }

  $("connectForm").addEventListener("submit", async e => {
    e.preventDefault();
    token = $("tokenInput").value.trim();
    if (!token) return;
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      if ($("rememberToken").checked) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY);
    } catch {}
    await connect();
  });
  // Preview without a token: shows the switches using the published stock
  // list, but nothing can be saved until a token is connected.
  let preview = false;
  $("previewBtn").addEventListener("click", async () => {
    preview = true;
    saved = new Set(await window.MALUBA_STOCK);
    current = new Set(saved);
    $("connectPanel").hidden = true;
    $("stockPanel").hidden = false;
    renderStock();
    status("Preview only. Reload and connect with a token to save changes.", "");
  });
  $("forgetToken").addEventListener("click", () => {
    try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); } catch {}
    token = ""; $("tokenInput").value = "";
    $("stockPanel").hidden = true; $("connectPanel").hidden = false;
    status("Token removed from this device.", "ok");
  });

  // ---------- GitHub ----------
  const headers = () => ({ Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" });

  async function connect() {
    status("Connecting to GitHub…");
    $("connectBtn").disabled = true;
    try {
      const r = await fetch(`${api}?ref=${ADMIN.branch}&t=${Date.now()}`, { headers: headers(), cache: "no-store" });
      if (r.status === 401) throw new Error("GitHub rejected the token. Check it was copied fully and hasn’t expired.");
      if (r.status === 403) throw new Error("This token can’t access the repository. It needs Contents: Read and write on " + ADMIN.repo + ".");
      if (r.status === 404) throw new Error("data/stock.json was not found on GitHub. Check the repository name in js/admin.js.");
      if (!r.ok) throw new Error("GitHub error " + r.status);
      const file = await r.json();
      sha = file.sha;
      const data = JSON.parse(decodeURIComponent(escape(atob(file.content.replace(/\n/g, "")))));
      saved = new Set(Array.isArray(data.outOfStock) ? data.outOfStock : []);
      current = new Set(saved);
      $("connectPanel").hidden = true;
      $("stockPanel").hidden = false;
      renderStock();
      status(data.updated ? `Connected. Stock last saved ${new Date(data.updated).toLocaleString()}.` : "Connected.", "ok");
    } catch (err) {
      status(err.message, "error");
    } finally {
      $("connectBtn").disabled = false;
    }
  }

  async function saveStock() {
    const body = {
      message: `Update stock: ${current.size} product${current.size === 1 ? "" : "s"} out of stock`,
      branch: ADMIN.branch,
      sha,
      content: btoa(unescape(encodeURIComponent(JSON.stringify({ outOfStock: [...current].sort(), updated: new Date().toISOString() }, null, 2) + "\n"))),
    };
    status("Saving…");
    $("saveBtn").disabled = true;
    try {
      const r = await fetch(api, { method: "PUT", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.status === 409) throw new Error("Someone else changed the stock list just now. Reload the page and try again.");
      if (!r.ok) throw new Error("GitHub error " + r.status + ". The stock was not saved.");
      const res = await r.json();
      sha = res.content.sha;
      saved = new Set(current);
      renderStock();
      status("Saved. The website updates in about 2 minutes.", "ok");
    } catch (err) {
      status(err.message, "error");
    } finally {
      $("saveBtn").disabled = false;
    }
  }

  // ---------- Stock list ----------
  function renderStock() {
    const items = window.MALUBA_ITEMS || [];
    const root = $("stockList");
    root.innerHTML = PRODUCTS.map((cat, ci) => `
      <section class="admin-cat">
        <h2>${esc(cat.title)}</h2>
        ${cat.groups.map((g, gi) => `
          ${g.title ? `<h3>${esc(g.title)}</h3>` : ""}
          <ul class="admin-rows">
            ${items.filter(it => it.cat === ci && it.group === gi).map(it => `
            <li class="${current.has(it.id) ? "is-out" : ""}">
              <span class="admin-row__name">${esc(it.name)} <small>${esc(it.price)}</small></span>
              <label class="switch">
                <input type="checkbox" data-id="${esc(it.id)}" ${current.has(it.id) ? "" : "checked"}>
                <span class="switch__track" aria-hidden="true"></span>
                <span class="switch__label">${current.has(it.id) ? "Out of stock" : "In stock"}</span>
              </label>
            </li>`).join("")}
          </ul>`).join("")}
      </section>`).join("");

    root.querySelectorAll("input[data-id]").forEach(cb => cb.addEventListener("change", () => {
      if (cb.checked) current.delete(cb.dataset.id); else current.add(cb.dataset.id);
      const li = cb.closest("li");
      li.classList.toggle("is-out", !cb.checked);
      li.querySelector(".switch__label").textContent = cb.checked ? "In stock" : "Out of stock";
      updateBar();
    }));
    updateBar();
  }

  function changes() {
    let n = 0;
    new Set([...saved, ...current]).forEach(id => { if (saved.has(id) !== current.has(id)) n++; });
    return n;
  }
  function updateBar() {
    const n = changes();
    $("changeCount").textContent = n ? `${n} unsaved change${n === 1 ? "" : "s"}` : `${current.size} product${current.size === 1 ? "" : "s"} out of stock`;
    $("saveBtn").disabled = n === 0 || preview;
    $("discardBtn").hidden = n === 0;
  }

  $("saveBtn").addEventListener("click", saveStock);
  $("discardBtn").addEventListener("click", () => { current = new Set(saved); renderStock(); });
  $("allInStock").addEventListener("click", () => { current = new Set(); renderStock(); });
  window.addEventListener("beforeunload", e => { if (changes()) { e.preventDefault(); e.returnValue = ""; } });

  if (token) connect();
})();
