'use client'

import { useEffect, useState, type ReactNode } from 'react'

function BoothClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])
  const label = now
    ? now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    : '--:--:--'
  return (
    <time className="booth-header__clock" dateTime={now?.toISOString()} aria-label="Program clock">
      {label}
    </time>
  )
}

export function BoothHeader({ walletSlot }: { walletSlot?: ReactNode }) {
  return (
    <>
      <div className="booth-header__identity">
        <span className="booth-header__mark" aria-hidden="true">
          <span className="booth-header__tally" />
          <span className="booth-header__tally" />
          <span className="booth-header__tally" />
        </span>
        <div className="booth-header__copy">
          <strong>The Booth</strong>
          <span>Trader desk · NFL</span>
        </div>
        <span className="booth-header__onair">
          <i />
          ON AIR
        </span>
        <BoothClock />
      </div>
      {walletSlot ? <div className="booth-header__wallet">{walletSlot}</div> : null}
    </>
  )
}
