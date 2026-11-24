// =====================================================================
//  MALUBA BLOOMS PRICE LIST
//  To change a price, edit the text below. Nothing else needs changing.
//  Prices are written exactly as they should appear: "K1,400" for one
//  price, "K650 – K1,500" for a range.
//
//  PHOTOS: every product has its own card on product-gallery.html. Give a
//  product its photo as a third value (a file in images/products/ or a
//  full https:// link):
//      ["40 stems", "K750", "images/products/roses-40.jpg"],
//  Until a product has its own photo, the card shows the group's "image"
//  labelled "Sample photo", or "Photo coming soon" if there is none.
//  TODO: the current group images are generic stock photos; add a real
//  photo of each product.
//
//  ROSE_COLOURS lists the colours a customer can pick in the cart for any
//  group marked "colours: ROSE_COLOURS". Add or remove colours as stock
//  changes.
// =====================================================================
const ROSE_COLOURS = ["Red", "White", "Pink", "Yellow", "Peach", "Orange", "Purple", "Blue"];

// Shorthand for the stock photos used below
const stock = id => `https://images.unsplash.com/photo-${id}?w=900&q=80`;

const PRODUCTS = [
  {
    title: "Plain Roses",
    groups: [
      {
        colours: ROSE_COLOURS,
        image: stock("1494972308805-463bc619d34e"),
        items: [
          ["40 stems", "K750"],
          ["60 stems", "K950"],
          ["80 stems", "K1,150"],
          ["100 stems", "K1,400"],
          ["120 stems", "K1,650"],
          ["160 stems", "K2,000"],
          ["200 stems", "K2,800"],
          ["260 stems", "K3,200"],
          ["300 stems", "K3,800"],
          ["360 stems", "K4,500"],
          ["400 stems", "K5,000"],
          ["500 stems", "K5,800"],
        ],
      },
      {
        title: "Box of Roses",
        colours: ROSE_COLOURS,
        image: stock("1591886960571-74d43a9d4166"),
        items: [
          ["Extra small", "K1,800"],
          ["Small", "K2,500"],
          ["Medium", "K3,800"],
          ["Large", "K5,200"],
          ["Extra large", "K6,500"],
        ],
        note: "Glitter roses available at an additional K250.",
      },
    ],
  },
  {
    title: "Seasonal Mix",
    groups: [
      {
        title: "Bouquets",
        image: stock("1596438459194-f275f413d6ff"),
        items: [
          ["Small", "K1,200"],
          ["Medium", "K2,000"],
          ["Large", "K2,800"],
          ["Extra large", "K3,500"],
        ],
      },
      {
        title: "Boxes",
        image: stock("1487530811176-3780de880c2d"),
        items: [
          ["Small", "K1,700"],
          ["Medium", "K2,500"],
          ["Large", "K3,200"],
          ["Extra large", "K4,000"],
        ],
        note: "Subject to available seasonal flowers.",
      },
    ],
  },
  {
    title: "Imported Flowers",
    groups: [
      {
        title: "Plain Roses",
        colours: ROSE_COLOURS,
        image: stock("1495231916356-a86217efff12"),
        items: [
          ["40 stems", "K1,500"],
          ["50 stems", "K2,000"],
          ["60 stems", "K2,200"],
          ["80 stems", "K3,000"],
          ["100 stems", "K3,800"],
          ["200 stems", "K5,800"],
          ["300 stems", "K8,000"],
        ],
      },
      {
        title: "Seasonal Flowers (per bunch)",
        items: [
          ["St Joseph’s Lilies", "K850", stock("1469259943454-aa100abba749")],
          ["Tulips", "K1,000", stock("1561181286-d3fee7d55364")],
          ["Peonies", "K1,000", stock("1582794543139-8ac9cb0f7b11")],
          ["Chrysanthemums", "K450", stock("1606041008023-472dfb5e530f")],
          ["Hydrangeas", "K1,200"],
          ["Orchids", "K650", stock("1534885320675-b08aa131cc5e")],
          ["Carnations", "K450"],
        ],
      },
    ],
  },
  {
    title: "Arrangements",
    groups: [
      {
        title: "Sunflowers",
        image: stock("1455659817273-f96807779a8a"),
        items: [
          ["Small", "K650"],
          ["Medium", "K1,200"],
          ["Large", "K1,800"],
        ],
      },
      {
        title: "Table Centre Piece",
        image: stock("1457089328109-e5d9bd499191"),
        items: [
          ["Small", "K450"],
          ["Medium", "K650"],
          ["Large", "K850"],
        ],
      },
    ],
  },
  {
    title: "Weddings and Funerals",
    groups: [
      {
        title: "Wedding Bouquets",
        image: stock("1519741497674-611481863552"),
        items: [
          ["Bridal bouquet", "K650 – K1,500"],
          ["Bridesmaid’s bouquet", "K450 – K1,000"],
        ],
      },
      {
        title: "Funeral Wreaths",
        items: [
          ["Coffin spray", "K650 – K2,500"],
          ["Flat wreath", "K450 – K1,500"],
        ],
      },
    ],
  },
  {
    title: "Extras",
    groups: [
      {
        items: [
          ["Greeting card", "K50"],
          ["Vase upgrade", "K450 – K800"],
          ["Baby’s breath", "K300"],
          ["Gift wrapping", "K70 – K500"],
          ["Teddy", "K450 – K1,200"],
          ["Customized ribbon", "K250"],
          ["Customized helium balloon", "K350"],
          ["Customized topper", "K250"],
          ["Customized topper (with baby’s breath)", "K350"],
          ["Customized transparent bubble balloon", "K500"],
          ["Small round helium balloon", "K50"],
          ["20-inch heart-shaped helium balloon", "K250"],
          ["45-inch heart-shaped helium balloon", "K650"],
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------
//  Rendering (no need to edit).
//  - <div id="priceList">       homepage: name links to the photo page,
//                               "+" adds the item to the cart (js/cart.js)
//  - <div id="productGallery">  product-gallery.html: one card per photo,
//                               listing the items that use it
//  A price range (e.g. "K650 – K1,500") can't be charged online, so those
//  items go into the cart as "quote" items and are confirmed on WhatsApp.
// ---------------------------------------------------------------------
(function () {
  const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const priceValue = p => /[–-]/.test(p) ? 0 : Number(String(p).replace(/[^0-9.]/g, "")) || 0;

  // Flatten the data into one record per item
  const items = [];
  PRODUCTS.forEach((cat, ci) => cat.groups.forEach((g, gi) => g.items.forEach(([name, price, image]) => {
    const fullName = `${cat.title}${g.title ? " · " + g.title : ""} – ${name}`;
    items.push({
      id: slug(fullName), name, fullName, price, value: priceValue(price),
      ownImage: image || "",                       // this product's own photo
      image: image || g.image || cat.image || "",  // photo to show (own, else the group's)
      colours: g.colours || null, cat: ci, group: gi,
    });
  })));

  // The "+" button; js/cart.js listens for clicks on it
  const addButton = it => `
    <button type="button" class="add" data-id="${esc(it.id)}" data-name="${esc(it.fullName)}" data-price="${it.value}" data-label="${esc(it.price)}"
            ${it.colours ? `data-colours="${esc(it.colours.join("|"))}"` : ""}
            aria-label="Add ${esc(it.fullName)} (${esc(it.price)}) to cart">+</button>`;

  // ----- Homepage price list -----
  const list = document.getElementById("priceList");
  if (list) {
    list.innerHTML = PRODUCTS.map((cat, ci) => `
      <section class="price-cat" aria-labelledby="cat-${ci}">
        <h3 id="cat-${ci}">${esc(cat.title)}</h3>
        ${cat.groups.map((g, gi) => `
          ${g.title ? `<h4>${esc(g.title)}</h4>` : ""}
          <ul class="price-rows">
            ${items.filter(it => it.cat === ci && it.group === gi).map(it => `
            <li>
              <a class="row" href="product-gallery.html#${esc(it.id)}" aria-label="${esc(it.fullName)}, ${esc(it.price)}. See photo">
                <span class="name">${esc(it.name)}</span><span class="lead" aria-hidden="true"></span><span class="price">${esc(it.price)}</span>
              </a>
              ${addButton(it)}
            </li>`).join("")}
          </ul>
          ${g.note ? `<p class="price-note">${esc(g.note)}</p>` : ""}`).join("")}
      </section>`).join("");
  }

  // ----- Product gallery page: one card per product -----
  const gallery = document.getElementById("productGallery");
  if (gallery) {
    gallery.innerHTML = PRODUCTS.map((cat, ci) => `
      <section class="pg-cat" id="pg-cat-${ci}">
        <h2 class="pg-cat__title">${esc(cat.title)}</h2>
        <div class="pg-grid">
          ${items.filter(it => it.cat === ci).map(it => {
            const group = cat.groups[it.group];
            // Prefer the item's own photo; fall back to the group's photo, marked as a sample
            const own = Boolean(it.ownImage);
            const photo = it.ownImage || it.image;
            const sub = group.title || "";
            return `
            <article class="pg-card" id="${esc(it.id)}">
              ${photo
                ? `<div class="pg-card__img"><img src="${esc(photo)}" alt="${esc(it.fullName)}" loading="lazy" decoding="async">${own ? "" : `<span class="pg-card__tag">Sample photo</span>`}</div>`
                : `<div class="pg-card__img pg-card__img--none"><span>Photo coming soon</span></div>`}
              <div class="pg-card__body">
                ${sub ? `<p class="pg-card__sub">${esc(sub)}</p>` : ""}
                <h3>${esc(it.name)}</h3>
                <ul class="price-rows">
                  <li>
                    <span class="row"><span class="name">${esc(it.price)}</span><span class="lead" aria-hidden="true"></span></span>
                    ${addButton(it)}
                  </li>
                </ul>
                ${group.note ? `<p class="price-note">${esc(group.note)}</p>` : ""}
              </div>
            </article>`;
          }).join("")}
        </div>
      </section>`).join("");

    // Arriving from a price-list link (#product-id): show only that product.
    // With no hash, show the whole gallery.
    function focusTarget() {
      const id = decodeURIComponent(location.hash.slice(1));
      const card = id ? document.getElementById(id) : null;
      const single = Boolean(card && card.classList.contains("pg-card"));
      gallery.classList.toggle("pg-single", single);
      gallery.querySelectorAll(".pg-cat").forEach(sec => { sec.hidden = single && !sec.contains(card); });
      gallery.querySelectorAll(".pg-card").forEach(c => { c.hidden = single && c !== card; });
      gallery.querySelectorAll(".is-target").forEach(el => el.classList.remove("is-target"));
      document.querySelectorAll("[data-show-all]").forEach(el => { el.hidden = !single; });
      if (single) {
        card.classList.add("is-target");
        window.scrollTo({ top: 0 });
      }
    }
    window.addEventListener("hashchange", focusTarget);
    // Wait a tick so the fixed nav offset and lazy images settle
    setTimeout(focusTarget, 50);
  }
})();
