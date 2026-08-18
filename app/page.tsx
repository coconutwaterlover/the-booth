'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { PriceChart, useDailyDrip, useProphecy, useStarterGrant } from '@prophecy-dev/connect-react'
import {
  VenueShell,
  VenueKitStringsProvider,
  marketPath,
  Leaderboard,
  PositionsTable,
  FeaturedMarket,
  EmptyState,
  ActivityFeed,
  pickFeatured,
  fmtWei,
  usePositionsData,
  type PositionRow,
} from '@prophecy-dev/venue-kit'
import { useVenueMarkets } from './venue-markets'
import { BoothHeader } from './components/booth-header'
import { BoothAux, BoothFoot } from './components/booth-iso-return'
import { WalletButton } from './components/booth-session'
import { SimBook, SimFlow, SimQuote, useSimClock } from './components/booth-sim'
import { BoothSpark } from './components/booth-spark'
import { BoothWire } from './components/booth-wire'
import { BoothChannels, BoothQuotes, channelList, topInChannel } from './components/booth-board'
import { hitsChannel } from './components/booth-games'

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
  return (
    <div className="booth-telemetry" aria-label="Desk telemetry">
      <span>
        <i className="booth-dot booth-dot--live" />
        SRC LIVE
      </span>
      <span>MKTS {String(markets).padStart(2, '0')}</span>
      <span>PGM {pgm ? 'LOCKED' : 'NO SRC'}</span>
      <span>GRID 1080P</span>
      <span>TD DESK</span>
    </div>
  )
}

function DeskBible() {
  return (
    <div className="booth-bible" aria-label="Desk key">
      <span className="booth-bible__show">Show bible</span>
      <p>PGM = market on air · CAM 2 = quotes · CAM 3 = flow · CAM 4 = your book · CAM 5 = edge · WIRE = headlines</p>
    </div>
  )
}

function MyPositions({ channel }: { channel: string | null }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <MyPositionsInner channel={channel} />
}

function MyPositionsInner({ channel }: { channel: string | null }) {
  const { session } = useProphecy()
  const wallet = session?.wallet ?? null
  const book = usePositionsData(wallet)
  const positions = book.rows
    .filter((row) => hitsChannel(`${row.marketLabel ?? ''} ${row.position.marketTitle ?? row.position.marketName ?? ''}`, channel))
    .map((row) => row.position)
  return (
    <PositionsTable
      wallet={wallet}
      positions={positions}
      marketHref={(p) => marketPath(p.marketId, p.marketTitle ?? p.marketName, '/m')}
      renderCard={(row) => <PositionStrip row={row} />}
      emptyState={
        <BoothEmpty
          title={channel ? 'Book is flat on this ISO' : 'Book is flat'}
          message={channel ? 'No size on this channel.' : 'Take a side. Size and P/L land here.'}
        />
      }
    />
  )
}

function PositionStrip({ row }: { row: PositionRow }) {
  const position = row.position
  const href = marketPath(position.marketId, position.marketTitle ?? position.marketName, '/m')
  const sig = `${row.sizeLabel}|${row.valueLabel}|${row.pnlLabel}`
  const prev = useRef(sig)
  const [tick, setTick] = useState(false)

  useEffect(() => {
    if (prev.current === sig) return
    prev.current = sig
    setTick(true)
    const id = window.setTimeout(() => setTick(false), 620)
    return () => window.clearTimeout(id)
  }, [sig])

  return (
    <div className={`booth-pos ${tick ? 'is-tick' : ''}`}>
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
          <dd className={tick ? 'is-tick' : ''}>{row.sizeLabel ?? '—'}</dd>
        </div>
        <div>
          <dt>PX</dt>
          <dd className={tick ? 'is-tick' : ''}>{row.costLabel ?? '—'}</dd>
        </div>
        <div>
          <dt>MKT</dt>
          <dd className={tick ? 'is-tick' : ''}>{row.valueLabel ?? '—'}</dd>
        </div>
        <div>
          <dt>P/L</dt>
          <dd className={tick ? 'is-tick' : ''}>{row.pnlLabel ?? '—'}</dd>
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
  const [channel, setChannel] = useState<string | null>(null)
  const [pgmId, setPgmId] = useState<string | null>(null)
  const autoLead = events.length ? pickFeatured(events, 'trades') ?? pickFeatured(events, 'volume') : null
  const lead = (pgmId && events.find((event) => event.id === pgmId)) || autoLead
  const flow = topInChannel(events, channel)
  const flowMarket = lead && hitsChannel(`${lead.title ?? ''} ${lead.name ?? ''}`, channel) ? lead : flow
  const clock = useSimClock()
  const channels = channelList(events)

  return (
    <VenueKitStringsProvider value={TRADER_STRINGS}>
      <div data-density="dense" data-archetype="booth">
        <VenueShell
          maxWidth="100%"
          header={<BoothHeader walletSlot={<WalletButton />} />}
          mainClassName="booth-main"
          footer={<BoothFoot note="PGM · quotes · flow · book" />}
        >
          <>
            <DeskTelemetry markets={loading ? 0 : events.length} pgm={Boolean(lead)} />
            <DeskBible />
            <BoothWire />
            <BoothChannels channels={channels} value={channel} onChange={setChannel} />
            <GetPst />

            <div className="booth-wall">
              <div className="booth-desk">
                <Monitor cam="PGM 1" label="LEAD" live>
                {lead ? (
                  <div className="booth-pgm">
                    <div className="booth-pgm__chart">
                      <span className="booth-pgm__chart-label">PX · LIVE · ON PGM</span>
                      <PriceChart market={lead.id} live height={96} showGrid={false} showLegend={false} className="booth-spark__chart" />
                    </div>
                    <div data-venue-hero>
                      <FeaturedMarket
                        event={lead}
                        pulse
                        cardHref={(event) => marketPath(event.id, event.title ?? event.name, '/m')}
                      />
                    </div>
                    <BoothSpark marketId={lead.id} height={36} label="PX · TAPE" />
                  </div>
                ) : (
                  <div className="booth-pgm" data-venue-hero>
                    <SimQuote clock={clock} />
                    <BoothEmpty title="No PGM source" message="Waiting for a tradeable NFL market." />
                  </div>
                )}
              </Monitor>

              <Monitor cam="CAM 2" label="LIVE QUOTES" live>
                <BoothQuotes
                  events={events}
                  loading={loading}
                  channel={channel}
                  pgmId={lead?.id ?? null}
                  onLock={setPgmId}
                  empty={<BoothEmpty title="Board is dark" message="No tradeable NFL quotes on this ISO." />}
                />
              </Monitor>

              <div className="booth-stack">
                <Monitor cam="CAM 3" label="FLOW" live>
                  <SimFlow clock={clock} channel={channel} />
                  {flowMarket ? (
                    <ActivityFeed
                      marketId={flowMarket.id}
                      limit={12}
                      emptyState={<BoothEmpty title="No prints" message="Flow lands here when size hits this ISO." />}
                    />
                  ) : (
                    <BoothEmpty title="No flow source" message="Lock a PGM market to see prints." />
                  )}
                </Monitor>
                <Monitor cam="CAM 4" label="OPEN BOOK">
                  <SimBook clock={clock} channel={channel} />
                  <MyPositions channel={channel} />
                </Monitor>
                <Monitor cam="CAM 5" label="EDGE">
                  <Leaderboard
                    metric="edge"
                    limit={8}
                    metricLabel="Edge"
                    emptyState={<BoothEmpty title="No edge tape" message="Right calls rank here." />}
                  />
                </Monitor>
              </div>
            </div>
              <BoothAux />
            </div>
          </>
        </VenueShell>
      </div>
    </VenueKitStringsProvider>
  )
}
