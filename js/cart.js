// ============ Cart + checkout ============
// Tapping a price-list row adds it to a cart kept in the browser
// (localStorage). checkout.html shows the cart, takes the customer's
// details and either:
//   - charges the order with Flutterwave (Airtel Money or card) when
//     FLUTTERWAVE_PUBLIC_KEY in js/main.js is set, or
//   - sends the order on WhatsApp so payment can be arranged there.
// Items whose price is a range ("quote" items, price 0) are always
// confirmed on WhatsApp, so online payment is only offered when every
// item in the cart has a fixed price.
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
  document.querySelectorAll(".price-rows button[data-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      add({
        id: btn.dataset.id, name: btn.dataset.name, price: Number(btn.dataset.price) || 0, label: btn.dataset.label,
        colours: btn.dataset.colours ? btn.dataset.colours.split("|") : null, chosen: [],
      });
      showToast(`Added <strong>${esc(btn.dataset.name)}</strong>. <a href="checkout.html">Go to checkout</a>`);
    });
  });

  // ---------- Checkout page ----------
  const list = document.getElementById("cartList");
  if (!list) return;

  const $ = id => document.getElementById(id);
  const form = $("checkoutForm");
  const payOnline = Boolean(flwKey) && typeof FlutterwaveCheckout === "function";

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
    syncPayment(items);
  }

  // Which ways to pay are available for this cart
  function syncPayment(items) {
    const t = totals(items);
    const canPay = payOnline && t.quotes === 0 && t.sum > 0;
    $("payOptions").hidden = !canPay;
    const why = $("payUnavailable");
    why.hidden = canPay;
    if (!canPay) {
      why.textContent = !payOnline
        ? "Online payment is being set up. Send your order on WhatsApp and we’ll share Airtel Money or card payment details there."
        : "Your cart has an item that needs a quote, so we’ll confirm the price and payment on WhatsApp.";
    }
    const label = canPay ? `Pay ${money(t.sum)}` : "Send order on WhatsApp";
    $("submitBtn").textContent = label;
    $("barBtn").textContent = label;
  }

  // Address only when Delivery is chosen
  function syncAddress() {
    const delivery = form.querySelector('[name="fulfilment"]:checked')?.value === "Delivery";
    $("addressField").hidden = !delivery;
    $("addressField").querySelector("input").required = delivery;
  }
  form.querySelectorAll('[name="fulfilment"]').forEach(r => r.addEventListener("change", syncAddress));
  syncAddress();
  renderCart();

  // ---------- Build the order summary ----------
  function orderDetails() {
    const f = new FormData(form);
    const items = load();
    return {
      items,
      lines: items.map(i => `${i.qty} x ${describe(i)} – ${i.price ? money(i.price * i.qty) : "to be quoted (" + i.label + ")"}`),
      name: f.get("name"), phone: f.get("phone"), email: f.get("email"),
      fulfilment: f.get("fulfilment") === "Delivery" ? `Delivery to: ${f.get("address")}` : "Pickup from the studio",
      date: f.get("date") || "Not specified",
      notes: f.get("message") || "-",
      method: f.get("method") || "airtel",
    };
  }

  function whatsappText(o, paid) {
    return `Hello Maluba Blooms! ${paid ? "I've just paid for an order." : "I'd like to place an order."}\n\n` +
      `ORDER\n${o.lines.join("\n")}\nTotal: ${totalText(o.items)}\n` +
      (paid ? `Paid via ${paid.method} – ref ${paid.ref}\n` : "") +
      `\nName: ${o.name}\nPhone: ${o.phone}\n${o.fulfilment}\nDate needed: ${o.date}\nNotes: ${o.notes}`;
  }

  function finish(o, paid) {
    save([]);
    $("checkoutGrid").hidden = true;
    $("cartEmpty").hidden = true;
    document.body.classList.remove("has-checkout-bar");
    const done = $("checkoutDone");
    $("doneTitle").innerHTML = paid ? "Payment received, <em>thank you.</em>" : "Your order is on its <em>way to us.</em>";
    $("doneText").textContent = paid
      ? `Reference ${paid.ref}. We’ve opened WhatsApp with your order details so we can confirm the delivery or pickup. Please send that message.`
      : "We’ve opened WhatsApp with your order details. Send the message and we’ll confirm availability, the final price and how to pay.";
    const link = $("doneWhatsApp");
    link.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappText(o, paid))}`;
    done.hidden = false;
    done.scrollIntoView({ behavior: "smooth", block: "start" });
    window.open(link.href, "_blank");
  }

  // ---------- Submit: pay online or send on WhatsApp ----------
  form.addEventListener("submit", e => {
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
    const t = totals(o.items);
    const canPay = payOnline && t.quotes === 0 && t.sum > 0;

    if (!canPay) return finish(o, null);

    const ref = "MB-" + Date.now().toString(36).toUpperCase();
    const methodName = o.method === "card" ? "Card" : "Airtel Money";
    $("submitBtn").disabled = $("barBtn").disabled = true;

    FlutterwaveCheckout({
      public_key: flwKey,
      tx_ref: ref,
      amount: t.sum,
      currency: "ZMW",
      country: "ZM",
      payment_options: o.method === "card" ? "card" : "mobilemoneyzambia",
      customer: { email: o.email, phone_number: o.phone, name: o.name },
      meta: {
        items: o.lines.join("; "),
        fulfilment: o.fulfilment,
        date_needed: o.date,
        notes: o.notes,
      },
      customizations: {
        title: "Maluba Blooms",
        description: "Flower order",
        logo: new URL("images/logo.jpg", location.href).href,
      },
      callback: data => {
        if (data.status === "successful" || data.status === "completed") {
          finish(o, { method: methodName, ref: data.tx_ref || ref });
        } else {
          showToast("Payment was not completed. You can try again or send the order on WhatsApp.");
          $("submitBtn").disabled = $("barBtn").disabled = false;
        }
      },
      onclose: () => { $("submitBtn").disabled = $("barBtn").disabled = false; },
    });
  });
})();
