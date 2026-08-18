'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  VenueShell,
  VenueKitStringsProvider,
  MarketDetail,
  ActivityFeed,
  ResolutionReceipt,
  EmptyState,
  ErrorState,
  Skeleton,
  fmtWei,
  short,
  useMarketDetailData,
} from '@prophecy-dev/venue-kit'
import { PriceChart, useConnect } from '@prophecy-dev/connect-react'
import { BoothHeader } from '../../components/booth-header'
import { BoothAux, BoothFoot } from '../../components/booth-iso-return'
import { WalletButton } from '../../components/booth-session'

function BoothEmpty({ title, message }: { title: string; message: string }) {
  return <EmptyState className="booth-empty" title={title} message={message} />
}

const TRADER_STRINGS = {
  market: {
    predict: 'Take',
    predictOutcome: (label: string) => `Position ${label}`,
    volumeSuffix: 'vol',
    tradesSuffix: 'prints',
    recentActivity: 'Prints',
  },
  positions: {
    sell: 'Exit',
  },
} as const

export function MarketView({ id }: { id: string }) {
  const { event, loading, notFound } = useMarketDetailData(id)
  const asked = event ? { ...event, title: event.name || event.title } : null

  return (
    <VenueKitStringsProvider value={TRADER_STRINGS}>
    <div data-density="dense" data-archetype="booth">
      <VenueShell
        maxWidth="100%"
        header={<BoothHeader walletSlot={<WalletButton />} />}
        mainClassName="booth-main"
        footer={<BoothFoot note="ISO · market" />}
      >
        <Link href="/" className="booth-back">
          ← PGM / board
        </Link>
        {loading ? (
          <div className="booth-detail-loading">
            <Skeleton width="70%" height={28} />
            <Skeleton height={220} radius={2} />
          </div>
        ) : notFound || !asked ? (
          <ErrorState title="Source dropped" message="That market is off the board. Return to PGM." />
        ) : (
          <div className="booth-iso">
            <section className="booth-monitor">
              <header className="booth-monitor__bezel">
                <span className="booth-monitor__cam">ISO 1</span>
                <span className="booth-monitor__label">MARKET</span>
                <span className="booth-monitor__live">LIVE</span>
              </header>
              <div className="booth-monitor__screen">
                <MarketDetail
                  marketId={id}
                  event={asked}
                  chart={<PriceChart market={id} live height={220} showGrid />}
                />
              </div>
            </section>

            <div className="booth-iso__side">
              <section className="booth-monitor">
                <header className="booth-monitor__bezel">
                  <span className="booth-monitor__cam">ISO 2</span>
                  <span className="booth-monitor__label">HOLDERS</span>
                  <span className="booth-monitor__stby">SIZE</span>
                </header>
                <div className="booth-monitor__screen">
                  <WhoIsIn
                    marketId={id}
                    outcomes={asked.outcomes}
                    decimals={asked.collateral?.decimals ?? 18}
                  />
                </div>
              </section>

              <section className="booth-monitor">
                <header className="booth-monitor__bezel">
                  <span className="booth-monitor__cam">ISO 3</span>
                  <span className="booth-monitor__label">FLOW</span>
                  <span className="booth-monitor__live">LIVE</span>
                </header>
                <div className="booth-monitor__screen">
                  <ActivityFeed
                    marketId={id}
                    limit={10}
                    emptyState={<BoothEmpty title="No prints" message="Next size hits this tape." />}
                  />
                </div>
              </section>
            </div>

            <section className="booth-monitor booth-iso__wide">
              <header className="booth-monitor__bezel">
                <span className="booth-monitor__cam">ISO 4</span>
                <span className="booth-monitor__label">RECEIPT</span>
                <span className="booth-monitor__stby">CALIBER</span>
              </header>
              <div className="booth-monitor__screen">
                <ResolutionReceipt
                  marketId={id}
                  emptyState={<BoothEmpty title="Unresolved" message="Receipt lands after the window closes." />}
                />
                <ResolutionNotes market={asked} />
              </div>
            </section>

          </div>
        )}
        <BoothAux />
      </VenueShell>
    </div>
    </VenueKitStringsProvider>
  )
}

interface HolderRow {
  wallet: string
  outcomeIndex: number
  shares: string
  costBasis: string
}

function WhoIsIn({
  marketId,
  outcomes,
  decimals,
}: {
  marketId: string
  outcomes: Array<{ index: number; label: string }>
  decimals: number
}) {
  const client = useConnect()
  const [holders, setHolders] = useState<HolderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setFailed(false)
    client.markets
      .holders(marketId, { limit: 6 })
      .then((result) => {
        if (alive) setHolders(result.holders)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [client, marketId])

  if (loading) {
    return (
      <div className="booth-holders__loading">
        <Skeleton height={28} />
        <Skeleton height={28} />
        <Skeleton height={28} />
      </div>
    )
  }
  if (failed) return <p className="booth-holders__empty">Holders feed dropped. Market still live.</p>
  if (holders.length === 0) return <p className="booth-holders__empty">No size on the book yet.</p>

  return (
    <ol className="booth-holders">
      {holders.map((holder, index) => (
        <li key={`${holder.wallet}-${holder.outcomeIndex}`}>
          <span className="booth-holders__rank">{String(index + 1).padStart(2, '0')}</span>
          <strong>{short(holder.wallet)}</strong>
          <span className="booth-holders__side">
            {outcomes.find((outcome) => outcome.index === holder.outcomeIndex)?.label ?? `Out ${holder.outcomeIndex}`}
          </span>
          <span className="booth-holders__shares">{fmtWei(holder.shares, decimals)}</span>
        </li>
      ))}
    </ol>
  )
}

function ResolutionNotes({ market }: { market: { title?: string | null; caliber?: Caliber | null } }) {
  const c = market.caliber
  if (!c || c.status !== 'rated') return null
  return (
    <details className="venue-resolution">
      <summary>
        How this resolves
        {c.band ? <span className="venue-resolution__band">Rated {c.band}</span> : null}
      </summary>
      {c.definition ? <p className="venue-resolution__lead">{c.definition}</p> : null}
      <ul className="venue-resolution__criteria">
        {(c.criteria ?? []).map((k) => (
          <li key={k.key} data-status={k.status}>
            <strong>{k.name}</strong> {k.summary}
          </li>
        ))}
      </ul>
      {c.detailUrl ? (
        <a href={c.detailUrl} target="_blank" rel="noreferrer noopener">
          Full rating on Caliber ↗
        </a>
      ) : null}
    </details>
  )
}

interface Caliber {
  status?: string | null
  band?: string | null
  definition?: string | null
  detailUrl?: string | null
  criteria?: Array<{ key: string; name: string; status: string; summary?: string | null }> | null
}
