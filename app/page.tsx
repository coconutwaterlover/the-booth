'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { PriceChart, useDailyDrip, useProphecy, useStarterGrant } from '@prophecy-dev/connect-react'
import {
  VenueShell,
  MarketGrid,
  marketPath,
  MiniLeaderboard,
  PositionsTable,
  FeaturedMarket,
  EmptyState,
  ActivityFeed,
  pickFeatured,
  fmtWei,
  type PositionRow,
} from '@prophecy-dev/venue-kit'
import { useVenueMarkets } from './venue-markets'
import { BoothHeader } from './components/booth-header'
import { WalletButton } from './components/booth-session'

const VENUE_PROMPTS = [
  {
    title: 'The four-facts brief',
    summary: 'Subject, name, audience, and scene for the truck.',
    prompt: `I want to make a venue about American football, where traders track live quotes, flow, and their positions across the board in real time.

Call it The Booth. It should feel like a broadcast production truck — banks of live feeds, a technical director's desk, monitors stacked with numbers and graphics running hot. It is for traders.

Build it by following https://docs.prophecyhosting.com/launch-a-venue.txt

Tell me the scope-check number before you design anything, using team and player names (Chiefs, Eagles, Bills, Mahomes, Allen, Kelce, Super Bowl), not the category name. If it is 0, stop — we will fix the terms first. When you are done, run npm run shot and show me the PNGs.`,
  },
  {
    title: 'The truck direction',
    summary: 'Dark, dense, monitor-lit. Hairline grid. Broadcast blue/green, amber for heat.',
    prompt: `The app should feel like a production truck mid-broadcast — dense, dark, monitor-lit. Multiple panels visible at once, live numbers updating, small telemetry-style labels everywhere. Use near-black background, broadcast blue and green for live/positive movement, warning amber for volatility, thin hairline grid dividers like a monitor wall.

Favor density and information bandwidth over breathing room — this is a terminal, not a landing page. Avoid daylight, playful illustration, or generous whitespace; avoid anything that reads as a consumer app rather than a desk.`,
  },
  {
    title: 'The trader desk',
    summary: 'Board, flow, and book visible at once. Numbers tick on change.',
    prompt: `This venue is for traders. Default to desktop, multi-panel layout: live quotes board, order flow / recent activity feed, and open positions should all be visible simultaneously without needing to navigate between them. Every number that updates in real time should visibly update — flash, tick, or pulse on change — rather than sitting static.

Prioritize price, size, and direction at a glance over narrative or explanation. Keep market content data-driven and preserve the venue kit's market, quote, predict, sell, and checkout wiring exactly as is. Restyle and restructure freely; never rewire.`,
  },
] as const

const GO_LIVE_COMMANDS = `prophecy login

prophecy venue create "The Booth"

prophecy deploy --key pck_… --venue the-booth`

const GO_LIVE_CARD = {
  title: 'Put the truck on air',
  summary: 'Create the venue, save the one-time key, and deploy. Sign-in works on *.venues.prophecyhosting.com.',
  prompt: `After the venue is built, put it live on Prophecy hosting. The key prints ONCE — save it. The folder name is the hostname: the-booth.venues.prophecyhosting.com.

${GO_LIVE_COMMANDS}`,
} as const

const FULL_VENUE_PROMPT = [
  ...VENUE_PROMPTS.map(({ title, prompt }) => `${title}\n\n${prompt}`),
  `${GO_LIVE_CARD.title}\n\n${GO_LIVE_CARD.prompt}`,
].join('\n\n---\n\n')

function BoothEmpty({ title, message }: { title: string; message: string }) {
  return <EmptyState className="booth-empty" title={title} message={message} />
}

function Monitor({
  cam,
  label,
  live,
  children,
}: {
  cam: string
  label: string
  live?: boolean
  children: ReactNode
}) {
  return (
    <section className="booth-monitor">
      <header className="booth-monitor__bezel">
        <span className="booth-monitor__cam">{cam}</span>
        <span className="booth-monitor__label">{label}</span>
        <span className={live ? 'booth-monitor__live' : 'booth-monitor__stby'}>{live ? 'LIVE' : 'STBY'}</span>
      </header>
      <div className="booth-monitor__screen">{children}</div>
    </section>
  )
}

function CopyVenueSection() {
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied((current) => (current === label ? null : current)), 1800)
    } catch {
      setCopied('Copy failed')
    }
  }

  return (
    <section className="booth-copy">
      <div className="booth-copy__intro">
        <span className="booth-copy__kicker">Show bible</span>
        <h2>Clone the truck.</h2>
        <p>The three prompts that built this desk, plus the commands that put it on air. Same markets as The Tailgate — different brand, same board.</p>
        <div className="booth-copy__actions">
          <button type="button" onClick={() => void copy('all', FULL_VENUE_PROMPT)}>
            {copied === 'all' ? 'Copied' : 'Copy venue prompt'}
          </button>
          <button type="button" className="booth-copy__secondary" onClick={() => void copy('deploy', GO_LIVE_COMMANDS)}>
            {copied === 'deploy' ? 'Copied' : 'Copy go-live commands'}
          </button>
        </div>
        <span className="booth-copy__status" aria-live="polite">
          {copied === 'Copy failed' ? 'Clipboard unavailable — open a card and copy it.' : ''}
        </span>
      </div>
      <div className="booth-copy__cards">
        {VENUE_PROMPTS.map((item, index) => {
          const label = `prompt-${index}`
          return (
            <article className="booth-prompt" key={item.title}>
              <span>Prompt {index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <details>
                <summary>Read the prompt</summary>
                <pre>{item.prompt}</pre>
              </details>
              <button type="button" onClick={() => void copy(label, item.prompt)}>
                {copied === label ? 'Copied' : 'Copy prompt'}
              </button>
            </article>
          )
        })}
        <article className="booth-prompt booth-prompt--live">
          <span>Go live</span>
          <h3>{GO_LIVE_CARD.title}</h3>
          <p>{GO_LIVE_CARD.summary}</p>
          <details open>
            <summary>Read the commands</summary>
            <pre>{GO_LIVE_COMMANDS}</pre>
          </details>
          <button type="button" onClick={() => void copy('deploy', GO_LIVE_COMMANDS)}>
            {copied === 'deploy' ? 'Copied' : 'Copy commands'}
          </button>
        </article>
      </div>
    </section>
  )
}

function MyPositions() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <MyPositionsInner />
}

function MyPositionsInner() {
  const { session } = useProphecy()
  return (
    <PositionsTable
      wallet={session?.wallet ?? null}
      marketHref={(p) => marketPath(p.marketId, p.marketTitle ?? p.marketName, '/m')}
      renderCard={(row) => <PositionStrip row={row} />}
      emptyState={<BoothEmpty title="Book is flat" message="Take a position and it lands on this monitor." />}
    />
  )
}

function PositionStrip({ row }: { row: PositionRow }) {
  const position = row.position
  const href = marketPath(position.marketId, position.marketTitle ?? position.marketName, '/m')
  return (
    <div className="booth-pos">
      <a className="booth-pos__title" href={href}>
        {row.marketLabel}
      </a>
      <dl className="booth-pos__stats">
        <div>
          <dt>DIR</dt>
          <dd>{row.side}</dd>
        </div>
        <div>
          <dt>SZ</dt>
          <dd>{row.sizeLabel ?? '—'}</dd>
        </div>
        <div>
          <dt>PX</dt>
          <dd>{row.costLabel ?? '—'}</dd>
        </div>
        <div>
          <dt>MKT</dt>
          <dd>{row.valueLabel ?? '—'}</dd>
        </div>
        <div>
          <dt>P/L</dt>
          <dd>{row.pnlLabel ?? '—'}</dd>
        </div>
      </dl>
      {row.statusLabel ? <span className="booth-pos__status">{row.statusLabel}</span> : null}
    </div>
  )
}

function GetPst() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <GetPstInner />
}

function GetPstInner() {
  const { authenticated } = usePrivy()
  const { isReady } = useProphecy()
  const grant = useStarterGrant()
  const drip = useDailyDrip()
  const [landed, setLanded] = useState(false)
  if (!authenticated) return null
  const showGrant = grant.enabled && !grant.granted
  const showDrip = drip.claimable || drip.claiming
  const showError = Boolean(grant.error || drip.error)
  if (!showGrant && !showDrip && !showError && !landed) return null
  const dripLabel = drip.amount > 0n ? `Claim ${fmtWei(drip.amount)} PST` : 'Claim PST'
  return (
    <section className="venue-pst">
      <span className="venue-pst__tag">COLD OPEN</span>
      {showGrant ? <span>Starter PST inbound.</span> : null}
      {landed && !showDrip ? <span className="venue-pst__ok">Daily PST on the book.</span> : null}
      {showError ? (
        <span className="venue-pst__error" role="alert">
          Claim failed. Run it again.
        </span>
      ) : null}
      {showDrip ? (
        <button
          type="button"
          className="venue-pst__claim"
          disabled={drip.claiming || !isReady}
          onClick={() => {
            void drip.claim().then((ok) => {
              if (ok) setLanded(true)
            })
          }}
        >
          {drip.claiming ? 'Claiming…' : !isReady ? 'Wallet warming…' : dripLabel}
        </button>
      ) : null}
    </section>
  )
}

export default function Page() {
  const all = useVenueMarkets()
  const loading = all.loading
  const events = all.events
  const lead = events.length ? pickFeatured(events, 'volume') : null

  return (
    <div data-density="dense" data-archetype="booth">
      <VenueShell
        maxWidth="100%"
        header={<BoothHeader walletSlot={<WalletButton />} />}
        mainClassName="booth-main"
        footer={
          <div className="booth-footer">
            <span>The Booth</span>
            <span>PGM · quotes · flow · book</span>
            <span>Traders only</span>
          </div>
        }
      >
        <>
          <div className="booth-telemetry" aria-label="Desk telemetry">
            <span>
              <i className="booth-dot booth-dot--live" />
              SRC LIVE
            </span>
            <span>MKTS {loading ? '…' : String(events.length).padStart(2, '0')}</span>
            <span>PGM {lead ? 'LOCKED' : 'NO SRC'}</span>
            <span>GRID 1080P</span>
            <span>TD DESK</span>
          </div>

          <GetPst />

          <div className="booth-desk">
            <Monitor cam="PGM 1" label="LEAD" live={Boolean(lead)}>
              {lead ? (
                <div className="booth-pgm" data-venue-hero>
                  <FeaturedMarket
                    event={lead}
                    pulse
                    cardHref={(event) => marketPath(event.id, event.title ?? event.name, '/m')}
                  />
                  <div className="booth-pgm__chart">
                    <span className="booth-pgm__chart-label">PX · LIVE</span>
                    <PriceChart market={lead.id} live height={148} showGrid />
                  </div>
                </div>
              ) : (
                <BoothEmpty title="No PGM source" message="Waiting for a tradeable football market." />
              )}
            </Monitor>

            <Monitor cam="CAM 2" label="LIVE QUOTES" live>
              <MarketGrid
                events={events}
                loading={loading}
                variant="list"
                pulse
                emptyState={<BoothEmpty title="Board is dark" message="No tradeable football quotes on this scope." />}
                cardHref={(event) => marketPath(event.id, event.title ?? event.name, '/m')}
              />
            </Monitor>

            <div className="booth-stack">
              <Monitor cam="CAM 3" label="FLOW" live={Boolean(lead)}>
                {lead ? (
                  <ActivityFeed
                    marketId={lead.id}
                    limit={12}
                    emptyState={<BoothEmpty title="No prints" message="Flow lands here when size hits the lead." />}
                  />
                ) : (
                  <BoothEmpty title="No flow source" message="Lock a PGM market to see prints." />
                )}
              </Monitor>
              <Monitor cam="CAM 4" label="OPEN BOOK">
                <MyPositions />
              </Monitor>
              <Monitor cam="CAM 5" label="EDGE">
                <MiniLeaderboard
                  metric="edge"
                  limit={6}
                  emptyState={<BoothEmpty title="No edge tape" message="Right calls rank here." />}
                />
              </Monitor>
            </div>
          </div>

          <CopyVenueSection />
        </>
      </VenueShell>
    </div>
  )
}
