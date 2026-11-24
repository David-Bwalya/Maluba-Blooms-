// ============ Cart + checkout ============
// Tapping "+" on a price-list row adds it to a cart kept in the browser
// (localStorage). checkout.html shows the cart, takes the customer's
// details and offers three ways to order:
//   - Mobile Money  (Airtel Money / MTN MoMo)
//   - Bank Card     (Visa / Mastercard)
//   - WhatsApp      (order sent as a message, payment arranged there)
//
// PAYMENTS: when FLUTTERWAVE_PUBLIC_KEY in js/main.js is set, Mobile Money
// and Bank Card open Flutterwave's secure checkout. While it is empty the
// same steps run in TEST MODE: the screens look real, but no request is
// sent and no money moves. A "Test mode" notice is shown on each step.
//
// Items whose price is a range ("quote" items, price 0) can't be charged,
// so a cart containing one can only be ordered on WhatsApp.
//
// Load order on every page: js/main.js, then this file.
(function () {
  const KEY = "maluba-cart";
  const whatsapp = typeof WHATSAPP_NUMBER !== "undefined" ? WHATSAPP_NUMBER : "";
  const flwKey = typeof FLUTTERWAVE_PUBLIC_KEY !== "undefined" ? FLUTTERWAVE_PUBLIC_KEY.trim() : "";

  // ---------- Storage ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  }
  function save(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
    updateBadges();
  }
  function add(item) {
    const items = load();
    const found = items.find(i => i.id === item.id);
    if (found) found.qty += 1; else items.push({ ...item, qty: 1 });
    save(items);
  }
  function setQty(id, qty) {
    const items = qty > 0
      ? load().map(i => i.id === id ? { ...i, qty } : i)
      : load().filter(i => i.id !== id);
    save(items);
  }
  // Toggle one colour on a cart line (rose items can mix several colours)
  function toggleColour(id, colour) {
    save(load().map(i => {
      if (i.id !== id) return i;
      const chosen = i.chosen || [];
      return { ...i, chosen: chosen.includes(colour) ? chosen.filter(c => c !== colour) : [...chosen, colour] };
    }));
  }
  const describe = i => i.name + (i.chosen?.length ? ` (${i.chosen.join(" + ")})` : "");
  const count = () => load().reduce((n, i) => n + i.qty, 0);

  // ---------- Helpers ----------
  const money = n => "K" + Number(n).toLocaleString("en-GB");
  const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const wait = ms => new Promise(r => setTimeout(r, ms));
  function totals(items) {
    const quotes = items.filter(i => !i.price).length;
    return { sum: items.reduce((n, i) => n + i.price * i.qty, 0), quotes };
  }
  const totalText = items => {
    const t = totals(items);
    return money(t.sum) + (t.quotes ? ` + ${t.quotes} item${t.quotes > 1 ? "s" : ""} to be quoted` : "");
  };

  // ---------- Nav badge ----------
  function updateBadges() {
    const n = count();
    document.querySelectorAll("[data-cart-count]").forEach(el => { el.textContent = n; el.hidden = n === 0; });
    document.querySelectorAll("[data-cart-count-inline]").forEach(el => { el.textContent = n ? `(${n})` : ""; });
  }
  updateBadges();

  // ---------- Toast ----------
  let toast, toastTimer;
  function showToast(html) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.innerHTML = html;
    requestAnimationFrame(() => toast.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
  }

  // ---------- Price list rows -> cart ----------
  document.querySelectorAll(".price-rows .add[data-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      add({
        id: btn.dataset.id, name: btn.dataset.name, price: Number(btn.dataset.price) || 0, label: btn.dataset.label,
        colours: btn.dataset.colours ? btn.dataset.colours.split("|") : null, chosen: [],
      });
      showToast(`Added <strong>${esc(btn.dataset.name)}</strong>. <a href="checkout.html">Go to checkout</a>`);
    });
  });

  // =====================================================================
  //  Checkout page
  // =====================================================================
  const list = document.getElementById("cartList");
  if (!list) return;

  const $ = id => document.getElementById(id);
  const form = $("checkoutForm");
  const live = Boolean(flwKey) && typeof FlutterwaveCheckout === "function";   // real payments on?

  const METHODS = {
    momo:     { label: "Mobile Money", flw: "mobilemoneyzambia" },
    card:     { label: "Bank Card",    flw: "card" },
    whatsapp: { label: "WhatsApp" },
  };
  const method = () => form.querySelector('[name="method"]:checked')?.value || "whatsapp";

  // ---------- Cart list ----------
  function renderCart() {
    const items = load();
    const has = items.length > 0;
    $("checkoutGrid").hidden = !has;
    $("cartEmpty").hidden = has;
    document.body.classList.toggle("has-checkout-bar", has);

    list.innerHTML = items.map(i => `
      <li class="cart-item" data-id="${esc(i.id)}">
        <div class="cart-item__info">
          <h3>${esc(i.name)}</h3>
          <p class="cart-item__price">${i.price ? money(i.price) + " each" : esc(i.label) + " · quoted on WhatsApp"}</p>
          ${i.colours ? `
          <p class="chips__label">Colour${i.colours.length > 1 ? "s" : ""} <span>· pick one or more</span></p>
          <div class="chips" role="group" aria-label="Rose colours">
            ${i.colours.map(c => `<button type="button" data-colour="${esc(c)}" aria-pressed="${(i.chosen || []).includes(c)}">${esc(c)}</button>`).join("")}
          </div>` : ""}
          <button type="button" class="cart-item__remove" data-remove>Remove</button>
        </div>
        <div class="qty" aria-label="Quantity">
          <button type="button" data-dec aria-label="Decrease quantity">&minus;</button>
          <span>${i.qty}</span>
          <button type="button" data-inc aria-label="Increase quantity">+</button>
        </div>
      </li>`).join("");

    list.querySelectorAll(".cart-item").forEach(row => {
      const id = row.dataset.id;
      const item = items.find(i => i.id === id);
      row.querySelector("[data-inc]").addEventListener("click", () => { setQty(id, item.qty + 1); renderCart(); });
      row.querySelector("[data-dec]").addEventListener("click", () => { setQty(id, item.qty - 1); renderCart(); });
      row.querySelector("[data-remove]").addEventListener("click", () => { setQty(id, 0); renderCart(); });
      row.querySelectorAll("[data-colour]").forEach(chip =>
        chip.addEventListener("click", () => { toggleColour(id, chip.dataset.colour); renderCart(); }));
    });

    const text = totalText(items);
    $("cartTotal").textContent = text;
    $("barTotal").textContent = text;
    syncMethod();
  }

  // ---------- Payment method & form state ----------
  function syncMethod() {
    const t = totals(load());
    const onlineOk = t.quotes === 0 && t.sum > 0;

    // Carts with a quote item can only go via WhatsApp
    form.querySelectorAll('[name="method"]').forEach(r => {
      if (r.value === "whatsapp") return;
      r.disabled = !onlineOk;
      r.closest("label").classList.toggle("is-disabled", !onlineOk);
      if (!onlineOk && r.checked) form.querySelector('[name="method"][value="whatsapp"]').checked = true;
    });
    const m = method();
    const online = m !== "whatsapp";

    $("quoteNote").hidden = onlineOk;
    $("momoField").hidden = m !== "momo";
    $("momoField").querySelector("input").required = m === "momo";
    form.querySelector('[name="email"]').required = online;   // receipts need an email
    $("testNote").hidden = !(online && !live);

    const label = m === "momo" ? `Pay ${money(t.sum)} with Mobile Money`
                : m === "card" ? `Pay ${money(t.sum)} by card`
                : "Send order on WhatsApp";
    $("submitBtn").textContent = label;
    $("barBtn").textContent = m === "whatsapp" ? "Send on WhatsApp" : `Pay ${money(t.sum)}`;
  }
  form.querySelectorAll('[name="method"]').forEach(r => r.addEventListener("change", syncMethod));

  // Prefill the mobile money number from the phone field
  form.querySelector('[name="phone"]').addEventListener("input", e => {
    const momo = form.querySelector('[name="momo"]');
    if (!momo.dataset.touched) momo.value = e.target.value;
  });
  form.querySelector('[name="momo"]').addEventListener("input", e => { e.target.dataset.touched = "1"; });

  // Address only when Delivery is chosen
  function syncAddress() {
    const delivery = form.querySelector('[name="fulfilment"]:checked')?.value === "Delivery";
    $("addressField").hidden = !delivery;
    $("addressField").querySelector("input").required = delivery;
  }
  form.querySelectorAll('[name="fulfilment"]').forEach(r => r.addEventListener("change", syncAddress));
  syncAddress();
  renderCart();

  // ---------- Order summary ----------
  function orderDetails() {
    const f = new FormData(form);
    const items = load();
    return {
      items,
      lines: items.map(i => `${i.qty} x ${describe(i)} – ${i.price ? money(i.price * i.qty) : "to be quoted (" + i.label + ")"}`),
      name: f.get("name"), phone: f.get("phone"), email: f.get("email"), momo: f.get("momo"),
      fulfilment: f.get("fulfilment") === "Delivery" ? `Delivery to: ${f.get("address")}` : "Pickup from the studio",
      date: f.get("date") || "Not specified",
      notes: f.get("message") || "-",
      method: method(),
    };
  }

  function whatsappText(o, paid) {
    return `Hello Maluba Blooms! ${paid ? "I've just paid for an order." : "I'd like to place an order."}\n\n` +
      `ORDER\n${o.lines.join("\n")}\nTotal: ${totalText(o.items)}\n` +
      (paid ? `Paid via ${paid.method}${paid.test ? " (TEST MODE – no money taken)" : ""} – ref ${paid.ref}\n` : "") +
      `\nName: ${o.name}\nPhone: ${o.phone}\n${o.fulfilment}\nDate needed: ${o.date}\nNotes: ${o.notes}`;
  }

  // Order placed: clear the cart, show the thank-you panel, open WhatsApp
  function finish(o, paid) {
    save([]);
    $("checkoutGrid").hidden = true;
    $("cartEmpty").hidden = true;
    document.body.classList.remove("has-checkout-bar");
    $("doneTitle").innerHTML = paid ? "Payment received, <em>thank you.</em>" : "Your order is on its <em>way to us.</em>";
    $("doneText").textContent = paid
      ? `Reference ${paid.ref}${paid.test ? " (test mode, no money was taken)" : ""}. We’ve opened WhatsApp with your order details so we can confirm the delivery or pickup. Please send that message.`
      : "We’ve opened WhatsApp with your order details. Send the message and we’ll confirm availability, the final price and how to pay.";
    const link = $("doneWhatsApp");
    link.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappText(o, paid))}`;
    $("checkoutDone").hidden = false;
    $("checkoutDone").scrollIntoView({ behavior: "smooth", block: "start" });
    window.open(link.href, "_blank");
  }

  // ---------- Payment sheet (the step-by-step payment screens) ----------
  const sheet = $("paySheet");
  let cancelled = false;
  function step({ eyebrow, title, text, action, spinner, test }) {
    return new Promise((resolve, reject) => {
      $("psEyebrow").textContent = eyebrow;
      $("psTitle").innerHTML = title;
      $("psText").textContent = text || "";
      $("psSpinner").hidden = !spinner;
      $("psTest").hidden = !test;
      const btn = $("psAction");
      btn.hidden = !action;
      btn.textContent = action || "";
      sheet.hidden = false;
      document.body.style.overflow = "hidden";
      btn.onclick = () => resolve("next");
      $("psCancel").onclick = () => { cancelled = true; reject(new Error("cancelled")); };
      if (!action) resolve("auto");
    });
  }
  function closeSheet() {
    sheet.hidden = true;
    document.body.style.overflow = "";
  }
  const testRef = prefix => prefix + "-TEST-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  // TEST MODE walk-throughs: same screens a customer will see, nothing is charged
  async function testMobileMoney(o, amount) {
    const number = o.momo || o.phone;
    await step({ eyebrow: "Mobile Money", title: "Confirm your number", test: true,
      text: `We’ll send a payment request for ${money(amount)} to ${number}. Make sure this is the Airtel Money or MTN MoMo number you want to pay from.`,
      action: "Send payment request" });
    await step({ eyebrow: "Mobile Money", title: "Check your phone", spinner: true, test: true,
      text: `A request for ${money(amount)} has been sent to ${number}. Approve it on your phone and enter your Mobile Money PIN.` });
    await wait(4000);
    if (cancelled) throw new Error("cancelled");
    await step({ eyebrow: "Mobile Money", title: "Payment <em>received</em>", test: true,
      text: `${money(amount)} received. Thank you!`, action: "Continue" });
    return { method: "Mobile Money", ref: testRef("MM"), test: true };
  }
  async function testCard(o, amount) {
    await step({ eyebrow: "Bank Card", title: "Secure card payment", test: true,
      text: `You’ll pay ${money(amount)} by Visa or Mastercard on our payment partner’s secure page. Your card details never touch this website.`,
      action: "Continue to card payment" });
    await step({ eyebrow: "Bank Card", title: "Authorising…", spinner: true, test: true,
      text: "Your bank is approving the payment. This usually takes a few seconds." });
    await wait(3000);
    if (cancelled) throw new Error("cancelled");
    await step({ eyebrow: "Bank Card", title: "Payment <em>approved</em>", test: true,
      text: `${money(amount)} paid. Thank you!`, action: "Continue" });
    return { method: "Bank Card", ref: testRef("CD"), test: true };
  }

  // LIVE: Flutterwave hosted checkout (Mobile Money or card)
  function livePayment(o, amount) {
    return new Promise((resolve, reject) => {
      const ref = "MB-" + Date.now().toString(36).toUpperCase();
      FlutterwaveCheckout({
        public_key: flwKey,
        tx_ref: ref,
        amount,
        currency: "ZMW",
        country: "ZM",
        payment_options: METHODS[o.method].flw,
        customer: { email: o.email, phone_number: o.momo || o.phone, name: o.name },
        meta: { items: o.lines.join("; "), fulfilment: o.fulfilment, date_needed: o.date, notes: o.notes },
        customizations: { title: "Maluba Blooms", description: "Flower order", logo: new URL("images/logo.jpg", location.href).href },
        callback: data => {
          if (data.status === "successful" || data.status === "completed") {
            resolve({ method: METHODS[o.method].label, ref: data.tx_ref || ref, test: false });
          } else reject(new Error("Payment was not completed."));
        },
        onclose: () => reject(new Error("cancelled")),
      });
    });
  }

  // ---------- Submit ----------
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const o = orderDetails();
    if (!o.items.length) return;

    // Rose items need at least one colour before the order goes through
    const missing = o.items.find(i => i.colours && !(i.chosen || []).length);
    if (missing) {
      const row = list.querySelector(`.cart-item[data-id="${CSS.escape(missing.id)}"]`);
      row?.classList.add("needs-colour");
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast(`Please pick a colour for <strong>${esc(missing.name)}</strong>.`);
      return;
    }

    if (o.method === "whatsapp") return finish(o, null);

    const amount = totals(o.items).sum;
    $("submitBtn").disabled = $("barBtn").disabled = true;
    cancelled = false;
    try {
      const paid = live
        ? await livePayment(o, amount)
        : await (o.method === "momo" ? testMobileMoney(o, amount) : testCard(o, amount));
      closeSheet();
      finish(o, paid);
    } catch (err) {
      closeSheet();
      if (err.message !== "cancelled") showToast(esc(err.message) + " You can try again or order on WhatsApp.");
    } finally {
      $("submitBtn").disabled = $("barBtn").disabled = false;
    }
  });
})();
