// =====================================================================
//  MALUBA BLOOMS PRICE LIST
//  To change a price, edit the text below. Nothing else needs changing.
//  Prices are written exactly as they should appear: "K1,400" for one
//  price, "K650 – K1,500" for a range.
//
//  ROSE_COLOURS lists the colours a customer can pick in the cart for any
//  group marked "colours: ROSE_COLOURS". Add or remove colours as stock
//  changes.
// =====================================================================
const ROSE_COLOURS = ["Red", "White", "Pink", "Yellow", "Peach", "Orange", "Purple", "Blue"];

const PRODUCTS = [
  {
    title: "Plain Roses",
    groups: [
      {
        colours: ROSE_COLOURS,
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
        items: [
          ["Small", "K1,200"],
          ["Medium", "K2,000"],
          ["Large", "K2,800"],
          ["Extra large", "K3,500"],
        ],
      },
      {
        title: "Boxes",
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
          ["St Joseph’s Lilies", "K850"],
          ["Tulips", "K1,000"],
          ["Peonies", "K1,000"],
          ["Chrysanthemums", "K450"],
          ["Hydrangeas", "K1,200"],
          ["Orchids", "K650"],
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
        items: [
          ["Small", "K650"],
          ["Medium", "K1,200"],
          ["Large", "K1,800"],
        ],
      },
      {
        title: "Table Centre Piece",
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
//  Renders the list above into <div id="priceList"> (no need to edit).
//  Each row is a button: tapping it adds the item to the cart (js/cart.js).
//  A price range (e.g. "K650 – K1,500") can't be charged online, so those
//  items go into the cart as "quote" items and are confirmed on WhatsApp.
// ---------------------------------------------------------------------
(function () {
  const root = document.getElementById("priceList");
  if (!root) return;
  const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  // "K1,400" -> 1400; a range like "K650 – K1,500" -> 0 (quote needed)
  const priceValue = p => /[–-]/.test(p) ? 0 : Number(String(p).replace(/[^0-9.]/g, "")) || 0;

  root.innerHTML = PRODUCTS.map((cat, i) => `
    <section class="price-cat" aria-labelledby="cat-${i}">
      <h3 id="cat-${i}">${esc(cat.title)}</h3>
      ${cat.groups.map(g => `
        ${g.title ? `<h4>${esc(g.title)}</h4>` : ""}
        <ul class="price-rows">
          ${g.items.map(([name, price]) => {
            const fullName = `${cat.title}${g.title ? " · " + g.title : ""} – ${name}`;
            const id = slug(fullName);
            const value = priceValue(price);
            return `
            <li>
              <button type="button" data-id="${esc(id)}" data-name="${esc(fullName)}" data-price="${value}" data-label="${esc(price)}"
                      ${g.colours ? `data-colours="${esc(g.colours.join("|"))}"` : ""}
                      aria-label="Add ${esc(fullName)} (${esc(price)}) to cart">
                <span class="name">${esc(name)}</span><span class="lead" aria-hidden="true"></span><span class="price">${esc(price)}</span><span class="add" aria-hidden="true">+</span>
              </button>
            </li>`;
          }).join("")}
        </ul>
        ${g.note ? `<p class="price-note">${esc(g.note)}</p>` : ""}`).join("")}
    </section>`).join("");
})();
