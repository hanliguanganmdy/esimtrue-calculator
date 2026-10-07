/*!
 * esimtrue-calculator v1.1.0 — MIT License
 * Rank eSIM plans by TRUE total trip cost, not headline price.
 *
 * The algorithm behind https://esimtrue.com — an independent eSIM
 * comparison site. Given a list of plans, a trip length and total data
 * need, it finds the cheapest way to cover the trip, including buying
 * multiple smaller plans when that beats one big plan.
 *
 * No paid ranking. No tracking. Sorting inputs are only price, days, data.
 * An optional exit-IP filter (plan.exit_ips) narrows results without
 * changing the ranking itself.
 * https://esimtrue.com/methodology
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.EsimTrueCalc = factory();
  }
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /**
   * Estimated daily data usage (GB) per usage tier.
   * light: chat, maps, email · medium: social, browsing, music · heavy: video, hotspot
   */
  var DAILY_GB = { light: 0.7, medium: 2, heavy: 5 };

  /**
   * A plan: { provider, data_gb, days, price_usd, unlimited, url, exit_ips }
   * - data_gb: total data in GB (null when fully unlimited)
   * - unlimited: true when total data is unlimited (data_gb may hold a daily high-speed allowance)
   * - days: validity in days; price_usd: total price in USD
   * - exit_ips: optional array of ISO country codes where the plan's traffic
   *   breaks out to the internet (e.g. ["US", "SG"]); used only by opts.exitIp
   */

  /**
   * Find the cheapest ways to cover a trip.
   *
   * @param {Array} plans   plan objects (see above); plans with price_usd == null are skipped
   * @param {number} days   trip length in days
   * @param {number} needGb total data needed for the trip (GB)
   * @param {Object} [opts]
   * @param {number} [opts.topN=3]        how many recommendations to return
   * @param {number} [opts.maxCopies=3]   max copies of one plan to stack
   * @param {string} [opts.exitIp]        only consider plans whose exit_ips includes
   *                                      this ISO country code (e.g. "US"); omit for no filter.
   *                                      Filtering never changes the ranking itself.
   * @returns {Array} [{ plan, count, cost }] sorted by total cost ascending.
   *   count > 1 means "buy N copies of this plan" — cheaper than one big plan.
   */
  function recommend(plans, days, needGb, opts) {
    opts = opts || {};
    var topN = opts.topN || 3;
    var maxCopies = opts.maxCopies || 3;
    var exitIp = opts.exitIp || "";
    days = Math.max(1, Math.floor(days));
    needGb = Math.max(0, needGb);

    var cands = [];
    plans.forEach(function (p) {
      if (p.price_usd === null || p.price_usd === undefined) return;
      if (exitIp && (!p.exit_ips || p.exit_ips.indexOf(exitIp) === -1)) return;
      for (var m = 1; m <= maxCopies; m++) {
        if (p.days * m < days) continue;
        var ok = p.unlimited || (p.data_gb * m) >= needGb;
        if (!ok) continue;
        cands.push({
          plan: p,
          count: m,
          cost: Math.round(p.price_usd * m * 100) / 100
        });
        break; // fewest copies that covers the trip wins for this plan
      }
    });

    cands.sort(function (a, b) { return a.cost - b.cost; });

    var seen = {}, out = [];
    cands.forEach(function (c) {
      var k = c.plan.provider + "|" + c.count + "|" + c.cost;
      if (!seen[k]) { seen[k] = 1; out.push(c); }
    });
    return out.slice(0, topN);
  }

  /**
   * Total data need (GB) for a trip from a usage tier.
   */
  function needForTrip(days, usage) {
    var perDay = DAILY_GB[usage] !== undefined ? DAILY_GB[usage] : DAILY_GB.medium;
    return Math.round(days * perDay * 10) / 10;
  }

  /**
   * Effective cost per day of a recommendation.
   */
  function costPerDay(rec, days) {
    return Math.round((rec.cost / days) * 100) / 100;
  }

  return {
    recommend: recommend,
    needForTrip: needForTrip,
    costPerDay: costPerDay,
    DAILY_GB: DAILY_GB,
    version: "1.1.0"
  };
}));
