// ============ CONFIG ============
// TODO: put the real WhatsApp number here (country code, no + or spaces)
const WHATSAPP_NUMBER = "260000000000";

// Instagram posts: see instagram/config.php (gallery code is in js/gallery.js)

// ============ Nav: change style on scroll ============
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 60);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ============ Mobile menu ============
const toggle = document.getElementById("navToggle");
const links = document.getElementById("navLinks");

function setMenu(open) {
  toggle.classList.toggle("open", open);
  links.classList.toggle("open", open);
  nav.classList.toggle("menu-open", open);
  document.body.style.overflow = open ? "hidden" : "";
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
toggle?.addEventListener("click", () => setMenu(!links.classList.contains("open")));
links?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));

// ============ Reveal on scroll ============
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

// ============ Order form -> WhatsApp ============
document.getElementById("orderForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const text =
    `Hello Maluba Blooms! I'd like to place an order.\n\n` +
    `Name: ${f.get("name")}\n` +
    `Phone: ${f.get("phone")}\n` +
    `Occasion: ${f.get("occasion")}\n` +
    `Date needed: ${f.get("date") || "Not specified"}\n` +
    `Details: ${f.get("message") || "-"}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
});

// ============ Footer year ============
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
