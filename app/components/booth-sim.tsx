'use client'

import { useEffect, useState } from 'react'

const YES_TICKS = [51.2, 52.8, 50.4, 53.6, 52.1, 54.0]
const SPARK_W = 220
const SPARK_H = 28

function sparkPath(values: number[]) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return values
    .map((v, i) => {
      const x = values.length === 1 ? 0 : (i / (values.length - 1)) * SPARK_W
      const y = SPARK_H - ((v - min) / span) * (SPARK_H - 2) - 1
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

const PRINTS = [
  { side: 'BUY', sz: '120', note: 'YES' },
  { side: 'SELL', sz: '80', note: 'NO' },
  { side: 'BUY', sz: '340', note: 'YES' },
  { side: 'BUY', sz: '25', note: 'YES' },
  { side: 'SELL', sz: '210', note: 'NO' },
] as const
const PNL_TICKS = [14.2, 18.6, 9.4, 21.1, 12.8, 19.5]

export function useSimClock() {
  const [step, setStep] = useState(0)
  const [hot, setHot] = useState(true)

  useEffect(() => {
    const hold = window.setTimeout(() => setHot(false), 8000)
    const first = window.setTimeout(() => setStep(1), 180)
    const beat = window.setInterval(() => {
      setStep((n) => n + 1)
      setHot(true)
      window.setTimeout(() => setHot(false), 620)
    }, 820)
    return () => {
      window.clearTimeout(hold)
      window.clearTimeout(first)
      window.clearInterval(beat)
    }
  }, [])

  const yes = YES_TICKS[step % YES_TICKS.length]
  const prev = YES_TICKS[(step + YES_TICKS.length - 1) % YES_TICKS.length]
  const dir = yes >= prev ? 'up' : 'down'
  const print = PRINTS[step % PRINTS.length]
  const pnl = PNL_TICKS[step % PNL_TICKS.length]
  const pnlPrev = PNL_TICKS[(step + PNL_TICKS.length - 1) % PNL_TICKS.length]
  const pnlDir = pnl >= pnlPrev ? 'up' : 'down'

  return { step, hot, yes, no: Number((100 - yes).toFixed(1)), dir, print, pnl, pnlDir }
}

export function SimSpark({ clock }: { clock: ReturnType<typeof useSimClock> }) {
  const series = YES_TICKS.map((_, i) => YES_TICKS[(clock.step + i) % YES_TICKS.length])
  const last = series[series.length - 1] ?? clock.yes
  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  const y = SPARK_H - ((last - min) / span) * (SPARK_H - 2) - 1
  return (
    <div className={`booth-spark booth-spark--sim ${clock.hot ? 'is-tick' : ''}`} data-dir={clock.dir}>
      <span className="booth-spark__label">PX</span>
      <svg className="booth-spark__svg" viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={sparkPath(series)} />
        <circle cx={SPARK_W} cy={y} r="2.4" />
      </svg>
    </div>
  )
}

export function SimQuote({ clock }: { clock: ReturnType<typeof useSimClock> }) {
  return (
    <article className={`booth-sim booth-sim--quote ${clock.hot ? 'is-tick' : ''}`} data-dir={clock.dir}>
      <header>
        <span>SIM</span>
        <span>GEN LOCK</span>
        <span className="booth-sim__live">LIVE</span>
      </header>
      <p>Mahomes starting QB · KC</p>
      <div className="booth-sim__px">
        <div className={`booth-sim__leg ${clock.dir === 'up' ? 'is-tick' : ''}`}>
          <span>YES</span>
          <strong>{clock.yes.toFixed(1)}</strong>
        </div>
        <div className={`booth-sim__leg ${clock.dir === 'down' ? 'is-tick' : ''}`}>
          <span>NO</span>
          <strong>{clock.no.toFixed(1)}</strong>
        </div>
      </div>
      <SimSpark clock={clock} />
    </article>
  )
}

export function SimFlow({ clock }: { clock: ReturnType<typeof useSimClock> }) {
  const rows = [0, 1, 2].map((offset) => PRINTS[(clock.step + PRINTS.length - offset) % PRINTS.length])
  return (
    <ol className="booth-sim-tape">
      {rows.map((row, i) => (
        <li key={`${clock.step}-${i}`} className={i === 0 && clock.hot ? 'is-tick' : ''}>
          <span>{row.side}</span>
          <span>{row.note}</span>
          <strong>{row.sz}</strong>
        </li>
      ))}
    </ol>
  )
}

export function SimBook({ clock }: { clock: ReturnType<typeof useSimClock> }) {
  return (
    <article className={`booth-sim booth-sim--book ${clock.hot ? 'is-tick' : ''}`} data-dir={clock.pnlDir}>
      <header>
        <span>SIM</span>
        <span>OPEN</span>
      </header>
      <p>Mahomes starting QB · KC</p>
      <dl>
        <div>
          <dt>DIR</dt>
          <dd>YES</dd>
        </div>
        <div>
          <dt>SZ</dt>
          <dd>250</dd>
        </div>
        <div>
          <dt>P/L</dt>
          <dd className={clock.hot ? 'is-tick' : ''}>{clock.pnlDir === 'up' ? '+' : ''}{clock.pnl.toFixed(1)}</dd>
        </div>
      </dl>
    </article>
  )
}
