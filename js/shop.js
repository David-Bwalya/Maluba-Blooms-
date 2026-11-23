// ============ Product grid (shop page + homepage "Shop Now") ============
// Markup: <div id="shopGrid" data-shop="all|featured"></div>
//   all      -> every product, with category filters (#shopFilters)
//   featured -> products marked featured: true in js/shop-data.js
(function () {
  const grid = document.getElementById("shopGrid");
  if (!grid) return;
  const mode = grid.dataset.shop || "all";
  const esc = MBCart.esc;

  let category = "all";
  const fromHash = location.hash.slice(1);
  if (MB_CATEGORIES.some(c => c.id === fromHash)) category = fromHash;

  function card(p) {
    const first = p.options[0];
    const single = p.options.length === 1;
    const catName = (MB_CATEGORIES.find(c => c.id === p.category) || {}).name || "";
    return `
      <article class="product" data-product="${esc(p.id)}">
        <div class="product__img"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async"></div>
        <div class="product__body">
          <p class="product__cat">${esc(catName)}</p>
          <h3 class="product__name">${esc(p.name)}</h3>
          <p class="product__desc">${esc(p.description)}</p>
          <fieldset class="product__options"${single ? " hidden" : ""}>
            <legend class="sr-only">Choose a package for ${esc(p.name)}</legend>
            ${p.options.map((o, i) => `
              <label class="opt">
                <input type="radio" name="opt-${esc(p.id)}" value="${esc(o.id)}"${i === 0 ? " checked" : ""}>
                <span>${esc(o.label)}</span>
              </label>`).join("")}
          </fieldset>
          <div class="product__buy">
            <p class="product__price" aria-live="polite">${formatK(first.price)}</p>
            <button type="button" class="btn btn--small product__add">Add to cart</button>
          </div>
        </div>
      </article>`;
  }

  function draw() {
    let list = MB_PRODUCTS;
    if (mode === "featured") list = list.filter(p => p.featured);
    else if (category !== "all") list = list.filter(p => p.category === category);
    grid.innerHTML = list.map(card).join("");
  }

  grid.addEventListener("change", e => {
    if (!e.target.matches(".opt input")) return;
    const el = e.target.closest(".product");
    const { option } = findProduct(el.dataset.product, e.target.value);
    el.querySelector(".product__price").textContent = formatK(option.price);
  });

  grid.addEventListener("click", e => {
    const btn = e.target.closest(".product__add");
    if (!btn) return;
    const el = btn.closest(".product");
    const optionId = el.querySelector(".opt input:checked").value;
    MBCart.add(el.dataset.product, optionId, 1);
    const { product, option } = findProduct(el.dataset.product, optionId);
    MBCart.notifyAdded(product, option);
    btn.textContent = "Added ✓";
    btn.classList.add("is-added");
    setTimeout(() => { btn.textContent = "Add to cart"; btn.classList.remove("is-added"); }, 1500);
  });

  // ---------- Category filters (shop page) ----------
  const bar = document.getElementById("shopFilters");
  if (bar && mode === "all") {
    const tabs = [{ id: "all", name: "All" }, ...MB_CATEGORIES];
    bar.innerHTML = tabs.map(t =>
      `<button type="button" data-cat="${esc(t.id)}" aria-pressed="${t.id === category}">${esc(t.name)}</button>`).join("");
    bar.addEventListener("click", e => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      category = b.dataset.cat;
      bar.querySelectorAll("[data-cat]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      history.replaceState(null, "", category === "all" ? location.pathname : `#${category}`);
      draw();
    });
  }

  draw();
})();
