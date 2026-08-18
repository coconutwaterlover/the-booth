const SISTER_DESKS = [
  { ch: 'CH 2', name: 'The Tailgate', href: 'https://the-tailgate.venues.prophecyhosting.com/' },
  { ch: 'CH 3', name: 'The Film Room', href: 'https://the-film-room.venues.prophecyhosting.com/' },
] as const

export function BoothAux() {
  return (
    <nav className="booth-aux" aria-label="Sister desks">
      <div className="booth-aux__meta">
        <span className="booth-aux__tag">AUX</span>
        <p>same lines · different room</p>
      </div>
      <div className="booth-aux__channels">
        {SISTER_DESKS.map((desk) => (
          <a key={desk.href} href={desk.href} className="booth-aux__ch">
            <span>{desk.ch}</span>
            <strong>{desk.name}</strong>
            <i>STBY</i>
          </a>
        ))}
      </div>
    </nav>
  )
}

export function BoothFoot({ note }: { note: string }) {
  return (
    <div className="booth-foot">
      <div className="booth-footer">
        <span>The Booth</span>
        <span>{note}</span>
        <span>Traders only</span>
      </div>
    </div>
  )
}
