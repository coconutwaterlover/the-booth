'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { PriceChart, useDailyDrip, useLiveStats, useProphecy, useStarterGrant } from '@prophecy-dev/connect-react'
import {
  VenueShell,
  VenueKitStringsProvider,
  MarketGrid,
  marketPath,
  Leaderboard,
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

const TRADER_STRINGS = {
  market: {
    predict: 'Take',
    predictOutcome: (label: string) => `Position ${label}`,
    volumeSuffix: 'vol',
    tradesSuffix: 'prints',
    recentActivity: 'Prints',
  },
  positions: {
    emptyTitle: 'Book is flat',
    emptyMessage: 'Size lands here when you take a side.',
    sell: 'Exit',
  },
  leaderboard: {
    trader: 'Desk',
    edge: 'Edge',
  },
} as const

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

function DeskTelemetry({ markets, pgm }: { markets: number; pgm: boolean }) {
  const { stats } = useLiveStats({ refreshMs: 4000 })
  return (
    <div className="booth-telemetry" aria-label="Desk telemetry">
      <span>
        <i className={`booth-dot ${stats?.upstream ? 'booth-dot--live' : ''}`} />
        {stats?.upstream ? 'HUB UP' : 'HUB'}
      </span>
      <span>MKTS {String(markets).padStart(2, '0')}</span>
      <span>TPM {stats ? stats.tradesPerMin.toFixed(1) : '—'}</span>
      <span>PRINTS {stats ? stats.recentTrades : '—'}</span>
      <span>PGM {pgm ? 'LOCKED' : 'NO SRC'}</span>
    </div>
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
      emptyState={<BoothEmpty title="Book is flat" message="Take a side. Size and P/L land here." />}
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
      <span className="venue-pst__tag">COLLATERAL</span>
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
    <VenueKitStringsProvider value={TRADER_STRINGS}>
      <div data-density="dense" data-archetype="booth">
        <VenueShell
          maxWidth="100%"
          header={<BoothHeader walletSlot={<WalletButton />} />}
          mainClassName="booth-main"
          footer={
            <div className="booth-footer">
              <span>The Booth</span>
              <span>NFL · quotes · flow · book</span>
              <span>Traders only</span>
            </div>
          }
        >
          <>
            <DeskTelemetry markets={loading ? 0 : events.length} pgm={Boolean(lead)} />
            <GetPst />

            <div className="booth-desk">
              <Monitor cam="CAM 1" label="LIVE QUOTES" live>
                <MarketGrid
                  events={events}
                  loading={loading}
                  variant="list"
                  pulse
                  emptyState={<BoothEmpty title="Board is dark" message="No tradeable NFL quotes on this scope." />}
                  cardHref={(event) => marketPath(event.id, event.title ?? event.name, '/m')}
                />
              </Monitor>

              <Monitor cam="PGM 1" label="PX" live={Boolean(lead)}>
                {lead ? (
                  <div className="booth-pgm" data-venue-hero>
                    <div className="booth-pgm__chart">
                      <span className="booth-pgm__chart-label">PX · LIVE</span>
                      <PriceChart market={lead.id} live height={168} showGrid />
                    </div>
                    <FeaturedMarket
                      event={lead}
                      pulse
                      cardHref={(event) => marketPath(event.id, event.title ?? event.name, '/m')}
                    />
                  </div>
                ) : (
                  <BoothEmpty title="No PGM source" message="Waiting for a tradeable NFL market." />
                )}
              </Monitor>

              <div className="booth-stack">
                <Monitor cam="CAM 2" label="OPEN BOOK">
                  <MyPositions />
                </Monitor>
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
                <Monitor cam="CAM 4" label="EDGE">
                  <Leaderboard
                    metric="edge"
                    limit={8}
                    metricLabel="Edge"
                    emptyState={<BoothEmpty title="No edge tape" message="Right calls rank here." />}
                  />
                </Monitor>
              </div>
            </div>
          </>
        </VenueShell>
      </div>
    </VenueKitStringsProvider>
  )
}
