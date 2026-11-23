// ============ Shop catalogue (SAMPLE DATA) ============
// Edit names, descriptions, photos and prices here. Prices are in Zambian
// Kwacha (K). Each product has one or more packages ("options"); the
// customer picks one, e.g. "10 stems" for K550.
//
// image: a file in images/ or a full https:// link.
// id / option ids: short, unique, no spaces (used to remember the cart).

const UNSPLASH = id => `https://images.unsplash.com/photo-${id}?w=800&h=800&fit=crop&q=75`;

const MB_CATEGORIES = [
  { id: "bouquets", name: "Custom Bouquets" },
  { id: "events",   name: "Weddings & Events" },
  { id: "gifts",    name: "Gifts & Hampers" },
  { id: "addons",   name: "Add-ons" },
];

const MB_PRODUCTS = [
  // ---------- Custom Bouquets ----------
  {
    id: "classic-roses", category: "bouquets", featured: true,
    name: "Classic Red Roses",
    description: "Long-stem red roses, hand-tied and wrapped in our signature paper.",
    image: UNSPLASH("1494972308805-463bc619d34e"),
    options: [
      { id: "10", label: "10 stems", price: 550 },
      { id: "20", label: "20 stems", price: 950 },
      { id: "30", label: "30 stems", price: 1350 },
      { id: "50", label: "50 stems", price: 2100 },
    ],
  },
  {
    id: "signature-roses", category: "bouquets", featured: true,
    name: "Signature Pink & White",
    description: "Our best-loved mix of blush pink and white roses, generously wrapped.",
    image: "images/service-1.jpg",
    options: [
      { id: "30",  label: "30 stems",  price: 1450 },
      { id: "50",  label: "50 stems",  price: 2250 },
      { id: "100", label: "100 stems", price: 4200 },
    ],
  },
  {
    id: "grand-bouquet", category: "bouquets",
    name: "Grand Celebration Bouquet",
    description: "An oversized statement bouquet for graduations and milestone moments.",
    image: "images/service-2.jpg",
    options: [
      { id: "100", label: "100 stems", price: 3800 },
      { id: "150", label: "150 stems", price: 5400 },
      { id: "200", label: "200 stems", price: 7000 },
    ],
  },
  {
    id: "seasonal-mixed", category: "bouquets",
    name: "Seasonal Mixed Bouquet",
    description: "The florist's choice of the freshest seasonal blooms and greenery.",
    image: UNSPLASH("1457089328109-e5d9bd499191"),
    options: [
      { id: "s", label: "Small",  price: 450 },
      { id: "m", label: "Medium", price: 750 },
      { id: "l", label: "Large",  price: 1100 },
    ],
  },
  {
    id: "sunflowers", category: "bouquets",
    name: "Sunshine Sunflowers",
    description: "Bright sunflowers with soft greenery, made to lift anyone's day.",
    image: UNSPLASH("1455659817273-f96807779a8a"),
    options: [
      { id: "5",  label: "5 stems",  price: 350 },
      { id: "10", label: "10 stems", price: 600 },
      { id: "15", label: "15 stems", price: 850 },
    ],
  },
  {
    id: "rainbow-roses", category: "bouquets",
    name: "Rainbow Roses",
    description: "Multi-coloured roses for something bold, playful and unforgettable.",
    image: UNSPLASH("1508610048659-a06b669e3321"),
    options: [
      { id: "12", label: "12 stems", price: 900 },
      { id: "24", label: "24 stems", price: 1650 },
    ],
  },

  // ---------- Weddings & Events ----------
  {
    id: "bridal-bouquet", category: "events", featured: true,
    name: "Bridal Bouquet",
    description: "Soft, romantic bridal flowers designed around your colours and dress.",
    image: UNSPLASH("1563241527-3004b7be0ffd"),
    options: [
      { id: "petite",  label: "Petite",  price: 1200 },
      { id: "classic", label: "Classic", price: 1800 },
      { id: "cascade", label: "Cascade", price: 2800 },
    ],
  },
  {
    id: "bridesmaids", category: "events",
    name: "Bridesmaid Bouquets",
    description: "Matching posies for your bridal party, coordinated with the bride's bouquet.",
    image: UNSPLASH("1591886960571-74d43a9d4166"),
    options: [
      { id: "1", label: "1 bouquet",    price: 450 },
      { id: "3", label: "Set of 3",     price: 1250 },
      { id: "5", label: "Set of 5",     price: 2000 },
    ],
  },
  {
    id: "centrepieces", category: "events",
    name: "Table Centrepieces",
    description: "Low, elegant arrangements for reception and dinner tables.",
    image: UNSPLASH("1519225421980-715cb0215aed"),
    options: [
      { id: "5",  label: "5 tables",  price: 2500 },
      { id: "10", label: "10 tables", price: 4800 },
      { id: "20", label: "20 tables", price: 9000 },
    ],
  },
  {
    id: "ceremony-decor", category: "events",
    name: "Ceremony & Venue Décor",
    description: "Aisle flowers, arch and entrance décor. We'll call to plan the details.",
    image: UNSPLASH("1469371670807-013ccf25f16a"),
    options: [
      { id: "intimate", label: "Intimate · up to 50 guests", price: 8500 },
      { id: "classic",  label: "Classic · up to 150 guests", price: 18000 },
      { id: "grand",    label: "Grand · up to 300 guests",   price: 32000 },
    ],
  },

  // ---------- Gifts & Hampers ----------
  {
    id: "roses-bubbly", category: "gifts", featured: true,
    name: "Roses & Bubbly Gift Set",
    description: "Red roses paired with a bottle of sparkling wine, ready to gift.",
    image: "images/service-3.jpg",
    options: [
      { id: "standard", label: "Standard", price: 1450 },
      { id: "deluxe",   label: "Deluxe",   price: 2100 },
    ],
  },
  {
    id: "balloon-bouquet", category: "gifts",
    name: "Bouquet & Balloon",
    description: "A fresh bouquet with a helium balloon. Add a name or message to personalise it.",
    image: "images/service-4.jpg",
    options: [
      { id: "plain",    label: "With balloon",              price: 850 },
      { id: "personal", label: "With personalised balloon", price: 1050 },
    ],
  },
  {
    id: "blush-box", category: "gifts",
    name: "Blush Flower Box",
    description: "Garden roses arranged in a keepsake box. No vase needed.",
    image: UNSPLASH("1582794543139-8ac9cb0f7b11"),
    options: [
      { id: "12", label: "12 stems", price: 750 },
      { id: "24", label: "24 stems", price: 1350 },
    ],
  },
  {
    id: "tulip-vase", category: "gifts",
    name: "Tulips in a Vase",
    description: "Fresh tulips delivered in a clear glass vase, ready to display.",
    image: UNSPLASH("1561181286-d3fee7d55364"),
    options: [
      { id: "10", label: "10 stems", price: 650 },
      { id: "20", label: "20 stems", price: 1150 },
    ],
  },
  {
    id: "sympathy", category: "gifts",
    name: "Sympathy Arrangement",
    description: "Calm white blooms to offer comfort and respect.",
    image: UNSPLASH("1460039230329-eb070fc6c77c"),
    options: [
      { id: "standard", label: "Standard", price: 700 },
      { id: "large",    label: "Large",    price: 1200 },
    ],
  },

  // ---------- Add-ons ----------
  {
    id: "chocolates", category: "addons",
    name: "Chocolate Truffles",
    description: "Handmade chocolate truffles to add to any order.",
    image: UNSPLASH("1549007994-cb92caebd54b"),
    options: [
      { id: "12", label: "Box of 12", price: 250 },
      { id: "24", label: "Box of 24", price: 450 },
    ],
  },
  {
    id: "vase", category: "addons",
    name: "Vase Upgrade",
    description: "Have your bouquet delivered arranged in a vase.",
    image: UNSPLASH("1612196808214-b8e1d6145a8c"),
    options: [
      { id: "glass",   label: "Glass vase",   price: 200 },
      { id: "ceramic", label: "Ceramic vase", price: 350 },
    ],
  },
];

// Delivery choices shown at checkout (fee in K).
const MB_DELIVERY = [
  { id: "pickup",    label: "Pick up from our studio",  fee: 0,   note: "Free" },
  { id: "town",      label: "Delivery within town",     fee: 80,  note: "Same or next day" },
  { id: "outskirts", label: "Delivery to the outskirts", fee: 150, note: "Next day" },
];

const MB_TIME_SLOTS = ["Morning (8am – 12pm)", "Afternoon (12pm – 4pm)", "Evening (4pm – 7pm)"];

function formatK(amount) {
  return "K" + Number(amount).toLocaleString("en-US");
}

function findProduct(productId, optionId) {
  const product = MB_PRODUCTS.find(p => p.id === productId);
  const option = product && product.options.find(o => o.id === optionId);
  return product && option ? { product, option } : null;
}
