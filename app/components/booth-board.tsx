'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { MarketCard, MarketGrid, marketPath, marketTitle, Skeleton } from '@prophecy-dev/venue-kit'
import { BoothSpark } from './booth-spark'
import { BOARD_TOP, SIM_GAMES, flowScore, gameOf, hitsChannel } from './booth-games'

type VenueEvent = {
  id: string
  title?: string | null
  name?: string | null
  tradeCount?: number
  totalVolume?: string | number | null
}

export function BoothChannels({
  channels,
  value,
  onChange,
}: {
  channels: string[]
  value: string | null
  onChange: (next: string | null) => void
}) {
  return (
    <nav className="booth-iso-ch" aria-label="Channel select">
      <span className="booth-iso-ch__tag">ISO CH</span>
      <div className="booth-iso-ch__btns">
        <button type="button" className={`booth-chip ${value === null ? 'booth-chip--live' : ''}`} onClick={() => onChange(null)}>
          ALL
        </button>
        {channels.map((abs) => (
          <button
            key={abs}
            type="button"
            className={`booth-chip ${value === abs ? 'booth-chip--live' : ''}`}
            onClick={() => onChange(value === abs ? null : abs)}
          >
            {abs}
          </button>
        ))}
      </div>
    </nav>
  )
}

function SimCluster({
  game,
  channel,
}: {
  game: (typeof SIM_GAMES)[number]
  channel: string | null
}) {
  const [open, setOpen] = useState(false)
  if (channel && !game.abs.includes(channel)) return null
  const head = game.markets.slice(0, BOARD_TOP)
  const tail = game.markets.slice(BOARD_TOP)
  return (
    <details className="booth-cluster" open>
      <summary>
        <span>{game.label}</span>
        <span>SIM</span>
        <span>{game.flow} PX</span>
      </summary>
      <ol className="booth-cluster__list">
        {head.map((row) => (
          <li key={row.title} className="booth-quote booth-quote--stby booth-quote--sim">
            <p>{row.title}</p>
            <strong>{row.yes.toFixed(1)}</strong>
            <span>{row.prints} prints</span>
          </li>
        ))}
      </ol>
      {tail.length ? (
        <>
          <button type="button" className="booth-more" onClick={() => setOpen((v) => !v)}>
            {open ? 'hide extra' : `more on the board · ${tail.length}`}
          </button>
          {open
            ? tail.map((row) => (
                <div key={row.title} className="booth-quote booth-quote--stby booth-quote--sim">
                  <p>{row.title}</p>
                  <strong>{row.yes.toFixed(1)}</strong>
                  <span>{row.prints} prints</span>
                </div>
              ))
            : null}
        </>
      ) : null}
    </details>
  )
}

function LiveCluster({
  label,
  events,
  pgmId,
  onLock,
}: {
  label: string
  events: VenueEvent[]
  pgmId: string | null
  onLock: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const head = events.slice(0, BOARD_TOP)
  const tail = events.slice(BOARD_TOP)
  const shown = open ? events : head
  return (
    <details className="booth-cluster" open>
      <summary>
        <span>{label}</span>
        <span>LIVE</span>
        <span>{events.length} MKTS</span>
      </summary>
      <MarketGrid
        events={shown as never}
        variant="list"
        pulse
        renderItem={(event) => {
          const onPgm = event.id === pgmId
          return (
            <div className={`booth-quote ${onPgm ? 'booth-quote--pgm' : 'booth-quote--stby'}`}>
              {onPgm ? <span className="booth-quote__tally">ON PGM</span> : null}
              <MarketCard
                market={event}
                pulse={onPgm}
                href={marketPath(event.id, marketTitle(event), '/m')}
                onClick={() => onLock(event.id)}
                renderFooter={
                  onPgm
                    ? () => <BoothSpark marketId={event.id} />
                    : () => (
                        <button type="button" className="booth-lock" onClick={() => onLock(event.id)}>
                          LOCK PGM
                        </button>
                      )
                }
              />
            </div>
          )
        }}
      />
      {tail.length ? (
        <button type="button" className="booth-more" onClick={() => setOpen((v) => !v)}>
          {open ? 'hide extra' : `more on the board · ${tail.length}`}
        </button>
      ) : null}
    </details>
  )
}

export function BoothQuotes({
  events,
  loading,
  channel,
  pgmId,
  onLock,
  empty,
}: {
  events: VenueEvent[]
  loading: boolean
  channel: string | null
  pgmId: string | null
  onLock: (id: string) => void
  empty: ReactNode
}) {
  const groups = useMemo(() => {
    const sorted = [...events].sort((a, b) => flowScore(b) - flowScore(a))
    const byKey = new Map<string, { label: string; flow: number; markets: VenueEvent[] }>()
    for (const event of sorted) {
      const game = gameOf(`${event.title ?? ''} ${event.name ?? ''}`)
      if (channel && !game.abs.includes(channel) && game.key !== 'board') continue
      if (channel && game.key === 'board') continue
      const row = byKey.get(game.key) ?? { label: game.label, flow: 0, markets: [] }
      row.markets.push(event)
      row.flow += flowScore(event)
      byKey.set(game.key, row)
    }
    return [...byKey.values()].sort((a, b) => b.flow - a.flow)
  }, [events, channel])

  const simVisible = SIM_GAMES.some((game) => !channel || game.abs.includes(channel))

  if (loading) {
    return (
      <div className="booth-quotes">
        <Skeleton height={72} />
        <Skeleton height={72} />
        <Skeleton height={48} />
      </div>
    )
  }

  if (!groups.length && !simVisible) return <>{empty}</>

  return (
    <div className="booth-quotes">
      {SIM_GAMES.map((game) => (
        <SimCluster key={game.key} game={game} channel={channel} />
      ))}
      {groups.map((group) => (
        <LiveCluster key={group.label} label={group.label} events={group.markets} pgmId={pgmId} onLock={onLock} />
      ))}
    </div>
  )
}

export function channelList(events: VenueEvent[]): string[] {
  const seen = new Set<string>()
  for (const game of SIM_GAMES) for (const abs of game.abs) seen.add(abs)
  for (const event of events) {
    for (const abs of gameOf(`${event.title ?? ''} ${event.name ?? ''}`).abs) seen.add(abs)
  }
  const preferred = ['KC', 'BUF', 'PHI', 'DAL', 'CHI', 'GB', 'PIT']
  return [...seen].sort((a, b) => {
    const ia = preferred.indexOf(a)
    const ib = preferred.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b)
  })
}

export function topInChannel(events: VenueEvent[], channel: string | null): VenueEvent | null {
  const pool = [...events]
    .filter((event) => hitsChannel(`${event.title ?? ''} ${event.name ?? ''}`, channel))
    .sort((a, b) => flowScore(b) - flowScore(a))
  return pool[0] ?? null
}
