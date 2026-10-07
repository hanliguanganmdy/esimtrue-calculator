# esimtrue-calculator

Rank eSIM plans by **true total trip cost** — not headline price, not "per GB" tricks.

This is the exact ranking algorithm behind [esimtrue.com](https://esimtrue.com), an independent eSIM comparison site. We open-sourced it so anyone can verify our rankings are honest: the inputs are only price, validity days and data allowance. No paid placement, no sponsored order, no tracking.

## The idea

Most comparison sites sort by unit price. That's misleading: a "$0.50/GB" plan is useless if its validity doesn't cover your trip, and a cheap 1-day plan bought 14 times costs more than a single 15-day plan.

`recommend()` answers the real question: **"For my N-day trip needing G GB, what's the cheapest way to stay connected?"** — including stacking multiple copies of a small plan when that beats one big plan.

## Usage

```js
const calc = require("./esimtrue-calculator.js");

const plans = [
  { provider: "Airalo", data_gb: 5,  days: 30, price_usd: 12.5, unlimited: false },
  { provider: "Nomad",  data_gb: 10, days: 30, price_usd: 18.0, unlimited: false },
  { provider: "Holafly", data_gb: null, days: 15, price_usd: 34.0, unlimited: true },
];

const days = 10;
const needGb = calc.needForTrip(days, "medium"); // 10 days × 2 GB/day = 20 GB

const top3 = calc.recommend(plans, days, needGb);
top3.forEach(r => console.log(
  `${r.plan.provider} × ${r.count} → $${r.cost} total ($${calc.costPerDay(r, days)}/day)`
));
```

In the browser, drop in the script tag and use `window.EsimTrueCalc` — no dependencies, no build step. See `demo.html` for a working example.

## API

### `recommend(plans, days, needGb, opts?)`
Returns up to `opts.topN` (default 3) recommendations sorted by total trip cost ascending. Each is `{ plan, count, cost }` where `count > 1` means "buy N copies of this plan". Plans with `price_usd == null` are skipped. A plan qualifies when `plan.days × count ≥ days` and (`plan.unlimited` or `plan.data_gb × count ≥ needGb`).

`opts.exitIp` (e.g. `"US"`) restricts results to plans whose `exit_ips` array includes that ISO country code — the countries where the plan's traffic breaks out to the internet. Filtering never changes the ranking itself; omit it for no filter.

### `needForTrip(days, usage)`
`"light"` (0.7 GB/day: chat, maps, email) · `"medium"` (2 GB/day: social, browsing, music) · `"heavy"` (5 GB/day: video, hotspot).

### `costPerDay(recommendation, days)`

## Verify our site with it

Every ranking on esimtrue.com can be reproduced: fetch `https://esimtrue.com/plans/jp.json` (per-country files, e.g. `plans/us.json` — lighter than the full `plans.json`), run `recommend()` on its `plans` array. If our displayed order ever disagrees with the algorithm's output, that's a bug — please open an issue.

Read the full methodology: https://esimtrue.com/methodology

## License

MIT — use it anywhere, including commercial projects. Attribution appreciated but not required.
