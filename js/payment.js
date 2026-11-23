// ============ Payments ============
// MODE "test": payments are SIMULATED in the browser. No money moves and
// nothing is sent anywhere. A banner on the payment step says so.
//
// GOING LIVE: sign up with a Zambian payment provider that supports mobile
// money and cards (e.g. Flutterwave, DPO Pay, Lenco). Then replace pay()
// below with a call to YOUR server, which creates the charge using the
// provider's secret key and returns its result. Never put a secret key in
// this file, and for cards use the provider's hosted/secure card form
// rather than the card fields on checkout.html.
const MBPayments = (function () {
  const MODE = "test";

  const METHODS = {
    airtel: { label: "Airtel Money",   kind: "momo", prefixes: ["97", "77"] },
    mtn:    { label: "MTN MoMo",       kind: "momo", prefixes: ["96", "76"] },
    zamtel: { label: "Zamtel Kwacha",  kind: "momo", prefixes: ["95", "75"] },
    card:   { label: "Visa / Mastercard", kind: "card" },
  };

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const ref = prefix => prefix + Math.random().toString(36).slice(2, 10).toUpperCase().padEnd(8, "0");

  /**
   * Charge the customer.
   * @param {object} p  { method, amount, phone (momo, 9 digits), card: { number, expMonth, expYear, cvc } }
   * @param {object} hooks { onStatus(text), signal (AbortSignal) }
   * @returns {Promise<{reference: string}>} rejects with Error(message) if declined/cancelled.
   */
  async function pay(p, hooks = {}) {
    const status = hooks.onStatus || (() => {});
    const check = () => { if (hooks.signal?.aborted) throw new Error("Payment cancelled."); };

    if (MODE !== "test") throw new Error("Live payments are not set up yet.");

    if (METHODS[p.method].kind === "momo") {
      status("waiting");
      await wait(4500); check();
      if (p.phone.endsWith("0000")) throw new Error("The payment request was not approved on the phone. No money was taken.");
      status("confirming");
      await wait(1200); check();
      return { reference: ref("MM") };
    }

    status("authorising");
    await wait(2500); check();
    if (p.card.number === "4000000000000002") throw new Error("Your card was declined by the bank. Please try another card or mobile money.");
    status("confirming");
    await wait(1000); check();
    return { reference: ref("CD") };
  }

  return { MODE, METHODS, pay };
})();
