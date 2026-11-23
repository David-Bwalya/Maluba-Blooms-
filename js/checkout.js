// ============ Checkout: details -> delivery -> payment -> review & pay ============
(function () {
  const form = document.getElementById("checkoutForm");
  if (!form) return;
  const F = form.elements; // named fields, e.g. F.phone
  const $ = id => document.getElementById(id);
  const esc = MBCart.esc;
  const ORDER_KEY = "mb-last-order";

  const main = $("checkoutMain"), empty = $("checkoutEmpty"), confirmation = $("confirmation");
  const steps = [...form.querySelectorAll(".co-step")];
  const progress = [...form.querySelectorAll(".co-progress li")];
  const nextBtn = $("nextBtn"), backBtn = $("backBtn"), stepError = $("stepError");
  let step = 1;

  // ---------- Options from the catalogue ----------
  $("deliveryOptions").innerHTML = MB_DELIVERY.map((d, i) => `
    <label class="choice">
      <input type="radio" name="delivery" value="${esc(d.id)}"${i === 0 ? " checked" : ""}>
      <span class="choice__main"><strong>${esc(d.label)}</strong><small>${esc(d.note)}</small></span>
      <span class="choice__price">${d.fee ? formatK(d.fee) : "Free"}</span>
    </label>`).join("");
  $("slotSelect").innerHTML = `<option value="">Choose a time</option>` +
    MB_TIME_SLOTS.map(s => `<option>${esc(s)}</option>`).join("");

  const today = new Date();
  const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  F.date.min = isoDate(today);

  if (MBPayments.MODE === "test") $("testBanner").hidden = false;

  // ---------- Helpers ----------
  const delivery = () => MB_DELIVERY.find(d => d.id === F.delivery.value) || MB_DELIVERY[0];
  const payMethod = () => F.payMethod.value;
  const total = () => MBCart.subtotal() + delivery().fee;

  // Zambian mobile number -> 9 digits (e.g. "971234567"), or "" if invalid.
  function zmPhone(v) {
    let d = String(v).replace(/\D/g, "");
    if (d.startsWith("260")) d = d.slice(3);
    if (d.startsWith("0")) d = d.slice(1);
    return /^[79][5-7]\d{7}$/.test(d) ? d : "";
  }
  const showPhone = d => `0${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;

  function luhn(num) {
    let sum = 0;
    [...num].reverse().forEach((c, i) => {
      let n = +c;
      if (i % 2) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
    });
    return sum % 10 === 0;
  }
  function parseExpiry(v) {
    const m = /^(\d{2})\s*\/?\s*(\d{2})$/.exec(v.trim());
    if (!m) return null;
    const month = +m[1], year = 2000 + +m[2];
    if (month < 1 || month > 12) return null;
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    return endOfMonth >= today ? { month, year } : null;
  }

  // ---------- Show/hide dependent fields ----------
  function setGroup(el, on) {
    el.hidden = !on;
    el.querySelectorAll("input, textarea, select").forEach(i => { i.disabled = !on; });
  }
  function syncDelivery() {
    const pickup = delivery().id === "pickup";
    setGroup($("addressFields"), !pickup);
    F.date.closest("label").firstChild.textContent = pickup ? "Pickup date" : "Delivery date";
    renderSummary();
  }
  function syncPayment() {
    const card = MBPayments.METHODS[payMethod()].kind === "card";
    setGroup($("momoFields"), !card);
    setGroup($("cardFields"), card);
  }
  form.addEventListener("change", e => {
    if (e.target.name === "delivery") syncDelivery();
    if (e.target.name === "payMethod") { syncPayment(); clearError(); }
  });

  // Input formatting for card fields.
  F.cardNumber.addEventListener("input", e => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 19);
    e.target.value = d.replace(/(.{4})/g, "$1 ").trim();
  });
  F.cardExpiry.addEventListener("input", e => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 4);
    e.target.value = d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
  });
  F.cardCvc.addEventListener("input", e => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4); });

  // ---------- Validation ----------
  function customChecks(scope) {
    scope.querySelectorAll("[data-zm-phone]").forEach(i => {
      if (i.disabled) return;
      i.setCustomValidity(i.value && !zmPhone(i.value) ? "Enter a valid Zambian mobile number, e.g. 097 123 4567." : "");
    });
    const momo = F.momoNumber;
    if (scope.contains(momo) && !momo.disabled && zmPhone(momo.value)) {
      const m = MBPayments.METHODS[payMethod()];
      momo.setCustomValidity(m.prefixes.includes(zmPhone(momo.value).slice(0, 2)) ? "" :
        `This number can't be used with ${m.label}. ${m.label} numbers start with ${m.prefixes.map(p => "0" + p).join(" or ")}.`);
    }
    if (scope.contains(F.cardNumber) && !F.cardNumber.disabled) {
      const n = F.cardNumber.value.replace(/\D/g, "");
      F.cardNumber.setCustomValidity(n && !(n.length >= 13 && luhn(n)) ? "Check the card number." : "");
      F.cardExpiry.setCustomValidity(F.cardExpiry.value && !parseExpiry(F.cardExpiry.value) ? "Enter a valid expiry date (MM / YY) that hasn't passed." : "");
      F.cardCvc.setCustomValidity(F.cardCvc.value && !/^\d{3,4}$/.test(F.cardCvc.value) ? "The CVC is the 3 or 4 digits on the back of the card." : "");
    }
    if (scope.contains(F.date) && F.date.value && F.date.value < F.date.min) {
      F.date.setCustomValidity("Please choose today or a later date.");
    } else F.date.setCustomValidity("");
  }
  function validStep(n) {
    const scope = steps[n - 1];
    customChecks(scope);
    const fields = [...scope.querySelectorAll("input, select, textarea")].filter(f => !f.disabled);
    const bad = fields.find(f => !f.checkValidity());
    if (bad) { bad.reportValidity(); bad.focus(); return false; }
    return true;
  }
  form.addEventListener("input", e => { if (e.target.validity && !e.target.validity.valid) e.target.setCustomValidity(""); });

  // ---------- Steps ----------
  function goTo(n) {
    step = n;
    steps.forEach((s, i) => { s.hidden = i !== n - 1; });
    progress.forEach((li, i) => {
      li.classList.toggle("is-done", i < n - 1);
      li.classList.toggle("is-current", i === n - 1);
      if (i === n - 1) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    backBtn.hidden = n === 1;
    nextBtn.textContent = n === 4 ? `Pay ${formatK(total())}` : "Continue";
    if (n === 4) renderReview();
    clearError();
    const top = form.getBoundingClientRect().top + window.scrollY - 110;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  }
  backBtn.addEventListener("click", () => goTo(step - 1));

  function showError(msg) { stepError.textContent = msg; stepError.hidden = false; }
  function clearError() { stepError.hidden = true; }

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!MBCart.count()) return showEmpty();
    if (!validStep(step)) return;
    if (step < 4) goTo(step + 1);
    else startPayment();
  });

  // ---------- Summary + review ----------
  function renderSummary() {
    const items = MBCart.items();
    $("summaryLines").innerHTML = items.map(i => `
      <li>
        <span class="co-summary__thumb"><img src="${esc(i.product.image)}" alt=""><b>${i.qty}</b></span>
        <span class="co-summary__name">${esc(i.product.name)}<small>${esc(i.option.label)}</small></span>
        <span class="co-summary__price">${formatK(i.total)}</span>
      </li>`).join("");
    $("sumSubtotal").textContent = formatK(MBCart.subtotal());
    $("sumDelivery").textContent = delivery().fee ? formatK(delivery().fee) : "Free";
    $("sumTotal").textContent = formatK(total());
    if (step === 4) nextBtn.textContent = `Pay ${formatK(total())}`;
  }

  function paymentSummary() {
    const m = MBPayments.METHODS[payMethod()];
    if (m.kind === "card") return `${m.label} ending ${F.cardNumber.value.replace(/\D/g, "").slice(-4)}`;
    return `${m.label} · ${showPhone(zmPhone(F.momoNumber.value))}`;
  }
  function deliverySummary() {
    const d = delivery();
    const when = `${new Date(F.date.value + "T12:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}, ${F.slot.value}`;
    if (d.id === "pickup") return { title: "Pickup from our studio", lines: [when] };
    return {
      title: d.label,
      lines: [`${F.recipient.value.trim()} · ${showPhone(zmPhone(F.recipientPhone.value))}`, F.address.value.trim(), when],
    };
  }
  function renderReview() {
    const d = deliverySummary();
    const contact = [F.name.value.trim(), showPhone(zmPhone(F.phone.value)), F.email.value.trim()].filter(Boolean);
    const row = (label, lines, editStep) => `
      <div class="review__row">
        <dt>${label}</dt>
        <dd>${lines.map(l => `<span>${esc(l)}</span>`).join("")}</dd>
        <button type="button" class="review__edit" data-goto="${editStep}">Edit</button>
      </div>`;
    $("reviewBox").innerHTML =
      row("Contact", contact, 1) +
      row("Delivery", [d.title, ...d.lines], 2) +
      (F.note.value.trim() ? row("Card message", [`“${F.note.value.trim()}”`], 2) : "") +
      row("Payment", [paymentSummary()], 3);
  }
  $("reviewBox").addEventListener("click", e => {
    const b = e.target.closest("[data-goto]");
    if (b) goTo(+b.dataset.goto);
  });

  // ---------- Payment ----------
  const overlay = $("payOverlay");
  let controller = null;

  async function startPayment() {
    const method = payMethod();
    const m = MBPayments.METHODS[method];
    const amount = total();
    const phone = zmPhone(F.momoNumber.value);
    controller = new AbortController();

    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    $("payCancel").hidden = false;
    $("payCancel").focus();
    let timer = null;

    const setStatus = s => {
      clearInterval(timer);
      $("payTimer").textContent = "";
      if (s === "waiting") {
        $("payTitle").textContent = "Check your phone";
        $("payText").innerHTML = `We've sent a payment request for <strong>${formatK(amount)}</strong> to <strong>${showPhone(phone)}</strong>. Enter your ${esc(m.label)} PIN on your phone to approve it.`;
        let left = 120;
        const tick = () => { $("payTimer").textContent = `Waiting for approval · ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; left--; };
        tick(); timer = setInterval(tick, 1000);
      } else if (s === "authorising") {
        $("payTitle").textContent = "Processing your card";
        $("payText").innerHTML = `Contacting your bank to authorise <strong>${formatK(amount)}</strong>. Please don't close this page.`;
      } else if (s === "confirming") {
        $("payCancel").hidden = true;
        $("payTitle").textContent = "Confirming payment";
        $("payText").textContent = "Almost done…";
      }
    };

    try {
      const card = m.kind === "card" ? {
        number: F.cardNumber.value.replace(/\D/g, ""),
        ...parseExpiry(F.cardExpiry.value),
        cvc: F.cardCvc.value,
      } : null;
      const result = await MBPayments.pay({ method, amount, phone, card }, { onStatus: setStatus, signal: controller.signal });
      clearInterval(timer);
      completeOrder(result.reference);
    } catch (err) {
      clearInterval(timer);
      closeOverlay();
      goTo(3);
      showError(err.message || "The payment didn't go through. Please try again.");
    }
  }
  $("payCancel").addEventListener("click", () => controller?.abort());
  function closeOverlay() {
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  // ---------- Order complete ----------
  function completeOrder(reference) {
    const now = new Date();
    const number = `MB-${isoDate(now).slice(2).replace(/-/g, "")}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const order = {
      number, reference, testMode: MBPayments.MODE === "test",
      placed: now.toISOString(),
      name: F.name.value.trim(),
      phone: showPhone(zmPhone(F.phone.value)),
      email: F.email.value.trim(),
      items: MBCart.items().map(i => ({ name: i.product.name, option: i.option.label, qty: i.qty, total: i.total })),
      subtotal: MBCart.subtotal(),
      deliveryFee: delivery().fee,
      total: total(),
      delivery: deliverySummary(),
      note: F.note.value.trim(),
      payment: paymentSummary(), // card: last 4 digits only
    };
    try { sessionStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch { /* ignore */ }
    MBCart.clear();
    form.reset();
    closeOverlay();
    history.replaceState(null, "", `checkout.html?order=${encodeURIComponent(number)}`);
    showConfirmation(order);
  }

  function showConfirmation(o) {
    main.hidden = true;
    empty.hidden = true;
    confirmation.hidden = false;
    $("checkoutTitle").textContent = "Order confirmed";
    document.title = "Order confirmed — Maluba Blooms";
    $("confName").textContent = o.name.split(" ")[0];
    $("confLead").textContent = o.delivery.title.startsWith("Pickup")
      ? "Your payment was received. We'll have your order ready for pickup and message you when it's done."
      : "Your payment was received. We'll prepare your flowers and message you when they're on the way.";

    const lines = o.items.map(i => `<li><span>${i.qty} × ${esc(i.name)} <small>${esc(i.option)}</small></span><span>${formatK(i.total)}</span></li>`).join("");
    $("receipt").innerHTML = `
      ${o.testMode ? `<p class="receipt__test">Test order: no real payment was taken.</p>` : ""}
      <div class="receipt__meta">
        <div><span>Order number</span><strong>${esc(o.number)}</strong></div>
        <div><span>Payment ref</span><strong>${esc(o.reference)}</strong></div>
        <div><span>Paid with</span><strong>${esc(o.payment)}</strong></div>
      </div>
      <ul class="receipt__lines">${lines}</ul>
      <dl class="co-totals">
        <div><dt>Subtotal</dt><dd>${formatK(o.subtotal)}</dd></div>
        <div><dt>Delivery</dt><dd>${o.deliveryFee ? formatK(o.deliveryFee) : "Free"}</dd></div>
        <div class="co-totals__grand"><dt>Total paid</dt><dd>${formatK(o.total)}</dd></div>
      </dl>
      <div class="receipt__delivery">
        <span>${esc(o.delivery.title)}</span>
        ${o.delivery.lines.map(l => `<p>${esc(l)}</p>`).join("")}
        ${o.note ? `<p>Card message: “${esc(o.note)}”</p>` : ""}
      </div>`;

    const text =
      `Hello Maluba Blooms! I've just paid for order ${o.number}.\n\n` +
      o.items.map(i => `• ${i.qty} × ${i.name} (${i.option}) ${formatK(i.total)}`).join("\n") +
      `\n\nTotal paid: ${formatK(o.total)} (ref ${o.reference})\n` +
      `${o.delivery.title}\n${o.delivery.lines.join("\n")}` +
      (o.note ? `\nCard message: "${o.note}"` : "") +
      `\n\nName: ${o.name}\nPhone: ${o.phone}`;
    $("confWhatsApp").href = `https://wa.me/${typeof WHATSAPP_NUMBER !== "undefined" ? WHATSAPP_NUMBER : ""}?text=${encodeURIComponent(text)}`;

    window.scrollTo({ top: 0 });
    confirmation.focus({ preventScroll: true });
  }

  function showEmpty() {
    main.hidden = true;
    empty.hidden = false;
  }

  // ---------- Start ----------
  const wanted = new URLSearchParams(location.search).get("order");
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(ORDER_KEY) || "null"); } catch { /* ignore */ }

  if (wanted && saved && saved.number === wanted) {
    showConfirmation(saved);
  } else if (!MBCart.count()) {
    showEmpty();
  } else {
    main.hidden = false;
    syncDelivery();
    syncPayment();
    goTo(1);
  }
  document.addEventListener("cart:change", () => {
    if (!confirmation.hidden) return;
    if (!MBCart.count()) showEmpty();
    else { empty.hidden = true; main.hidden = false; renderSummary(); }
  });
})();
