# The Booth

A trader-first [Prophecy](https://docs.prophecyhosting.com/welcome) venue about American football.
It is built to feel like a broadcast production truck: dark monitors, PGM locked, CAM slots for
quotes, flow, book, and edge.

Same lines, different room. The Tailgate and The Film Room sit on the same NFL board; this desk is
the one that reads the tape.

Live on [the-booth.venues.prophecyhosting.com](https://the-booth.venues.prophecyhosting.com).
Source lives at [github.com/coconutwaterlover/the-booth](https://github.com/coconutwaterlover/the-booth).

## On the desk

- **PGM** — the market on air: chart, featured card, PX tape
- **CAM 2** — live quotes grouped by game, compact until locked to PGM
- **CAM 3** — flow / prints on the active ISO
- **CAM 4** — your open book
- **CAM 5** — edge leaderboard
- **CAM WIRE** — ESPN NFL headlines, ranked to this venue’s scope
- **ISO CH** — team-abbreviation strip that narrows CAM 2, 3, and 4 together
- **AUX** — sister desks: [The Tailgate](https://the-tailgate.venues.prophecyhosting.com/) and [The Film Room](https://the-film-room.venues.prophecyhosting.com/)
- **Market pages** — ISO view of the question, holders, flow, and resolution receipt

Trading, prices, positions, and checkout stay inside Prophecy Connect and Venue Kit. This repo
restyles the truck; it does not rewire the trade path.

See [AGENTS.md](AGENTS.md) if you are changing the venue.

## Requirements

- Node.js 18 or newer
- npm
- A Prophecy npm access key for the private `@prophecy-dev/*` packages

The tracked `.npmrc` reads the token from the environment. Do not commit the token itself:

```bash
export NPM_TOKEN=<your-prophecy-npm-key>
```

Without it, `npm install` returns **404** for `@prophecy-dev/*`. That means not signed in, not that
the packages are missing.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Privy app used for sign-in must allow that
exact origin, including the port.

The venue runs on Somnia testnet. After you sign in, starter PST can auto-claim and a daily drip is
available to claim by hand.

## Verify

```bash
npm run typecheck
npm run validate
npm run build
npm run shot
```

`validate` is the same check that gates a Prophecy deploy. It also prints a **scope check** — how
many tradeable markets this venue actually matches. `ON THE BOARD: 0` means a visitor sees a dark
board.

`shot` writes `shots/desktop.png` and `shots/mobile.png`. It needs Playwright and Chromium available
to the Prophecy CLI. Look at the PNGs; no other check looks at the page.

## Market scope

This venue is a view over Prophecy’s market pool, not the pool itself. The search lives in
[`app/venue-markets.ts`](app/venue-markets.ts):

```ts
const VENUE_QUERY = "NFL"
const VENUE_TERMS = ["NFL", "Kansas City Chiefs", "Pittsburgh Steelers"]
```

Search matches **market titles**. Team and player names usually hit; broad topics like `American
sports` usually do not. After you change the query or terms:

1. Run `npm run validate`
2. Stop if the scope report says `ON THE BOARD: 0`
3. Regenerate and inspect the screenshots

Always feed markets through `useVenueMarkets()`. A bare `<MarketGrid />` fetches the global pool.

## Project structure

```text
app/
  page.tsx                      TD desk: PGM, quotes, flow, book, edge
  venue-markets.ts              Venue-scoped market search
  providers.tsx                 Connect, Privy, theme, and the checkout drawer
  api/wire/route.ts             Cached ESPN NFL headline wire
  components/booth-header.tsx
  components/booth-board.tsx    Game clusters, ISO CH, ON PGM
  components/booth-wire.tsx
  m/[id]/market-view.tsx        Market ISO: holders, flow, receipt
  globals.css                   Booth visual system
shots/                          Generated visual checks
```

The checkout drawer is mounted once in `app/providers.tsx`. Do not move, wrap, or unmount it.

## Restyle freely. Never rewire.

Pricing, market truth, positions, resolution, and trading stay in Prophecy Connect and Venue Kit.
Do not calculate prices, post trades, fork `<OrderEntry>`, or bypass `<ProphecyCheckout>`.

People **predict**, they take a **position**, they are **right or wrong**. Do not write *bet*,
*odds*, *wager*, or *gamble*.

## Deploy

```bash
prophecy login
prophecy deploy --venue the-booth
```

The venue id is `the-booth`. A new clone still needs its own key from
`prophecy venue create "The Booth"` — that command prints the `pck_…` key once. This repo already
has the key in `app/providers.tsx`.

The launch walkthrough is at
[docs.prophecyhosting.com/launch-a-venue.txt](https://docs.prophecyhosting.com/launch-a-venue.txt).

## Documentation

- [Prophecy Connect](https://docs.prophecyhosting.com/welcome)
- [Make a venue](https://docs.prophecyhosting.com/make-a-venue)
- [Prompt to venue](https://docs.prophecyhosting.com/prompt-to-venue)
