'use client'

import { useEffect, useState } from 'react'

type Headline = { title: string; href: string; source: string }

export function BoothWire() {
  const [items, setItems] = useState<Headline[] | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/wire')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return
        const next = Array.isArray(j?.items) ? (j.items as Headline[]) : []
        setItems(next)
      })
      .catch(() => {
        if (alive) setItems([])
      })
    return () => {
      alive = false
    }
  }, [])

  const ready = items !== null
  const live = Boolean(items && items.length)
  const loop = live && items ? [...items, ...items] : []

  return (
    <section className="booth-wire" aria-label="Headline wire">
      <header className="booth-wire__bezel">
        <span className="booth-monitor__cam">CAM WIRE</span>
        <span className="booth-monitor__label">HEADLINES · SRC ESPN</span>
        <span className={live ? 'booth-monitor__live' : 'booth-monitor__stby'}>{live ? 'LIVE' : 'STBY'}</span>
      </header>
      <div className="booth-wire__screen">
        {!ready ? (
          <p className="booth-wire__empty">Wire warming…</p>
        ) : !live ? (
          <p className="booth-wire__empty">No feed. Wire is dark on this scope.</p>
        ) : (
          <div className="booth-wire__viewport">
            <div className="booth-wire__marquee">
              {loop.map((item, i) => (
                <a key={`${item.href}-${i}`} href={item.href} target="_blank" rel="noreferrer">
                  <span>{item.source}</span>
                  {item.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
