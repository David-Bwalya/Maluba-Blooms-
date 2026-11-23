// ============ Cart (shared by every page) ============
// Needs js/shop-data.js loaded first. The cart is kept in this browser
// (localStorage) so it survives page changes; if storage is blocked the
// cart still works until the page is closed.
//
// Public API: MBCart.add(productId, optionId, qty), .items(), .count(),
// .subtotal(), .setQty(key, qty), .remove(key), .clear(), .open(), .close()

const MBCart = (function () {
  const KEY = "mb-cart-v1";
  let memory = [];

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      memory = Array.isArray(raw) ? raw : [];
    } catch { /* storage unavailable: keep in-memory cart */ }
    // Drop anything no longer in the catalogue.
    memory = memory.filter(l => findProduct(l.productId, l.optionId) && l.qty > 0);
    return memory;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch { /* ignore */ }
    render();
    document.dispatchEvent(new CustomEvent("cart:change"));
  }

  const keyOf = (productId, optionId) => `${productId}:${optionId}`;

  function items() {
    return memory.map(l => {
      const { product, option } = findProduct(l.productId, l.optionId);
      return { key: keyOf(l.productId, l.optionId), product, option, qty: l.qty, total: option.price * l.qty };
    });
  }
  const count = () => memory.reduce((n, l) => n + l.qty, 0);
  const subtotal = () => items().reduce((s, i) => s + i.total, 0);

  function add(productId, optionId, qty = 1) {
    if (!findProduct(productId, optionId)) return;
    const line = memory.find(l => keyOf(l.productId, l.optionId) === keyOf(productId, optionId));
    if (line) line.qty = Math.min(99, line.qty + qty);
    else memory.push({ productId, optionId, qty });
    save();
  }
  function setQty(key, qty) {
    const line = memory.find(l => keyOf(l.productId, l.optionId) === key);
    if (!line) return;
    if (qty <= 0) memory = memory.filter(l => l !== line);
    else line.qty = Math.min(99, qty);
    save();
  }
  const remove = key => setQty(key, 0);
  function clear() { memory = []; save(); }

  // ---------- Drawer UI ----------
  let drawer, backdrop, lastFocus;

  function build() {
    backdrop = document.createElement("div");
    backdrop.className = "cart-backdrop";
    backdrop.hidden = true;
    backdrop.addEventListener("click", close);

    drawer = document.createElement("aside");
    drawer.className = "cart-drawer";
    drawer.hidden = true;
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-labelledby", "cartTitle");
    drawer.innerHTML = `
      <div class="cart-drawer__head">
        <h2 id="cartTitle">Your <em>Cart</em></h2>
        <button type="button" class="cart-drawer__close" aria-label="Close cart">&times;</button>
      </div>
      <div class="cart-drawer__body"></div>
      <div class="cart-drawer__foot">
        <div class="cart-drawer__total"><span>Subtotal</span><strong></strong></div>
        <p class="cart-drawer__note">Delivery is added at checkout.</p>
        <a href="checkout.html" class="btn btn--full cart-drawer__checkout">Checkout</a>
        <button type="button" class="cart-drawer__continue">Continue shopping</button>
      </div>`;
    document.body.append(backdrop, drawer);

    drawer.querySelector(".cart-drawer__close").addEventListener("click", close);
    drawer.querySelector(".cart-drawer__continue").addEventListener("click", close);
    drawer.addEventListener("click", e => {
      const btn = e.target.closest("[data-cart-action]");
      if (!btn) return;
      const key = btn.closest("[data-key]").dataset.key;
      const line = items().find(i => i.key === key);
      if (!line) return;
      const action = btn.dataset.cartAction;
      if (action === "inc") setQty(key, line.qty + 1);
      if (action === "dec") setQty(key, line.qty - 1);
      if (action === "remove") remove(key);
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !drawer.hidden) close(); });
  }

  function render() {
    document.querySelectorAll("[data-cart-count]").forEach(el => {
      const n = count();
      el.textContent = n;
      el.hidden = n === 0;
    });
    document.querySelectorAll("[data-cart-open]").forEach(btn =>
      btn.setAttribute("aria-label", `Open cart (${count()} item${count() === 1 ? "" : "s"})`));
    if (!drawer) return;

    const list = items();
    const body = drawer.querySelector(".cart-drawer__body");
    drawer.querySelector(".cart-drawer__foot").hidden = list.length === 0;
    if (!list.length) {
      body.innerHTML = `<div class="cart-empty"><p>Your cart is empty.</p><a href="shop.html" class="link-arrow">Browse the shop &rarr;</a></div>`;
      return;
    }
    body.innerHTML = `<ul class="cart-lines">${list.map(i => `
      <li class="cart-line" data-key="${esc(i.key)}">
        <img src="${esc(i.product.image)}" alt="" loading="lazy">
        <div class="cart-line__info">
          <p class="cart-line__name">${esc(i.product.name)}</p>
          <p class="cart-line__option">${esc(i.option.label)} · ${formatK(i.option.price)}</p>
          <div class="qty" role="group" aria-label="Quantity">
            <button type="button" data-cart-action="dec" aria-label="One less">&minus;</button>
            <span aria-live="polite">${i.qty}</span>
            <button type="button" data-cart-action="inc" aria-label="One more">+</button>
          </div>
        </div>
        <div class="cart-line__end">
          <strong>${formatK(i.total)}</strong>
          <button type="button" class="cart-line__remove" data-cart-action="remove">Remove</button>
        </div>
      </li>`).join("")}</ul>`;
    drawer.querySelector(".cart-drawer__total strong").textContent = formatK(subtotal());
  }

  function open() {
    if (!drawer) build();
    hideToast();
    render();
    lastFocus = document.activeElement;
    backdrop.hidden = false;
    drawer.hidden = false;
    requestAnimationFrame(() => { backdrop.classList.add("is-open"); drawer.classList.add("is-open"); });
    document.body.style.overflow = "hidden";
    drawer.querySelector(".cart-drawer__close").focus();
  }
  function close() {
    if (!drawer || drawer.hidden) return;
    backdrop.classList.remove("is-open");
    drawer.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => { drawer.hidden = true; backdrop.hidden = true; }, 300);
    lastFocus?.focus?.();
  }

  // ---------- "Added" toast ----------
  let toast, toastTimer;
  function notifyAdded(product, option) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "cart-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span><strong>Added:</strong> ${esc(product.name)} · ${esc(option.label)}</span>
      <button type="button">View cart</button>`;
    toast.querySelector("button").addEventListener("click", () => { hideToast(); open(); });
    toast.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 3500);
  }
  const hideToast = () => toast?.classList.remove("is-shown");

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ---------- Start ----------
  load();
  document.addEventListener("DOMContentLoaded", () => {
    render();
    document.querySelectorAll("[data-cart-open]").forEach(b => b.addEventListener("click", open));
  });
  // Keep tabs in sync if the cart changes in another tab.
  window.addEventListener("storage", e => {
    if (e.key !== KEY) return;
    load(); render();
    document.dispatchEvent(new CustomEvent("cart:change"));
  });

  return { add, items, count, subtotal, setQty, remove, clear, open, close, notifyAdded, esc };
})();
