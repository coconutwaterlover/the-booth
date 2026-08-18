export const NFL_TEAMS = [
  { abs: 'ARI', label: 'Cardinals', names: ['arizona', 'cardinals'] },
  { abs: 'ATL', label: 'Falcons', names: ['atlanta', 'falcons'] },
  { abs: 'BAL', label: 'Ravens', names: ['baltimore', 'ravens'] },
  { abs: 'BUF', label: 'Bills', names: ['buffalo', 'bills'] },
  { abs: 'CAR', label: 'Panthers', names: ['carolina', 'panthers'] },
  { abs: 'CHI', label: 'Bears', names: ['chicago', 'bears'] },
  { abs: 'CIN', label: 'Bengals', names: ['cincinnati', 'bengals'] },
  { abs: 'CLE', label: 'Browns', names: ['cleveland', 'browns'] },
  { abs: 'DAL', label: 'Cowboys', names: ['dallas', 'cowboys'] },
  { abs: 'DEN', label: 'Broncos', names: ['denver', 'broncos'] },
  { abs: 'DET', label: 'Lions', names: ['detroit', 'lions'] },
  { abs: 'GB', label: 'Packers', names: ['green bay', 'packers'] },
  { abs: 'HOU', label: 'Texans', names: ['houston', 'texans'] },
  { abs: 'IND', label: 'Colts', names: ['indianapolis', 'colts'] },
  { abs: 'JAX', label: 'Jaguars', names: ['jacksonville', 'jaguars'] },
  { abs: 'KC', label: 'Chiefs', names: ['kansas city', 'chiefs', 'mahomes'] },
  { abs: 'LV', label: 'Raiders', names: ['las vegas', 'raiders'] },
  { abs: 'LAC', label: 'Chargers', names: ['los angeles chargers', 'chargers'] },
  { abs: 'LAR', label: 'Rams', names: ['los angeles rams', 'rams'] },
  { abs: 'MIA', label: 'Dolphins', names: ['miami', 'dolphins'] },
  { abs: 'MIN', label: 'Vikings', names: ['minnesota', 'vikings'] },
  { abs: 'NE', label: 'Patriots', names: ['new england', 'patriots'] },
  { abs: 'NO', label: 'Saints', names: ['new orleans', 'saints'] },
  { abs: 'NYG', label: 'Giants', names: ['new york giants', 'giants'] },
  { abs: 'NYJ', label: 'Jets', names: ['new york jets', 'jets'] },
  { abs: 'PHI', label: 'Eagles', names: ['philadelphia', 'eagles'] },
  { abs: 'PIT', label: 'Steelers', names: ['pittsburgh', 'steelers'] },
  { abs: 'SF', label: '49ers', names: ['san francisco', '49ers'] },
  { abs: 'SEA', label: 'Seahawks', names: ['seattle', 'seahawks'] },
  { abs: 'TB', label: 'Buccaneers', names: ['tampa bay', 'buccaneers'] },
  { abs: 'TEN', label: 'Titans', names: ['tennessee', 'titans'] },
  { abs: 'WAS', label: 'Commanders', names: ['washington', 'commanders'] },
] as const

export type GameKey = {
  key: string
  label: string
  abs: string[]
}

export function teamsIn(text: string): Array<(typeof NFL_TEAMS)[number]> {
  const hay = text.toLowerCase()
  return NFL_TEAMS.filter((team) => team.names.some((name) => hay.includes(name)))
}

export function gameOf(text: string): GameKey {
  const hits = teamsIn(text)
  if (hits.length >= 2) {
    const a = hits[0]
    const b = hits[1]
    return { key: `${a.abs}-${b.abs}`, label: `${a.abs} vs ${b.abs}`, abs: [a.abs, b.abs] }
  }
  if (hits.length === 1) {
    const a = hits[0]
    return { key: a.abs, label: `${a.abs} · ${a.label}`, abs: [a.abs] }
  }
  return { key: 'board', label: 'OPEN BOARD', abs: [] }
}

export function hitsChannel(text: string, channel: string | null): boolean {
  if (!channel) return true
  return gameOf(text).abs.includes(channel)
}

export function flowScore(event: { tradeCount?: number; totalVolume?: string | number | null }): number {
  const trades = Number(event.tradeCount ?? 0)
  const vol = Number(event.totalVolume ?? 0)
  return trades * 1e9 + (Number.isFinite(vol) ? vol : 0)
}

export const BOARD_TOP = 2

export const SIM_GAMES = [
  {
    key: 'KC-BUF',
    label: 'KC vs BUF',
    abs: ['KC', 'BUF'],
    flow: 940,
    markets: [
      { title: 'Chiefs win · Week 1', yes: 58.4, prints: 42 },
      { title: 'Mahomes starting QB · KC', yes: 96.2, prints: 38 },
      { title: 'Bills cover · BUF', yes: 44.1, prints: 21 },
      { title: 'Allen 300+ pass yds', yes: 51.8, prints: 11 },
    ],
  },
  {
    key: 'PHI-DAL',
    label: 'PHI vs DAL',
    abs: ['PHI', 'DAL'],
    flow: 610,
    markets: [
      { title: 'Eagles win · NFC East', yes: 61.0, prints: 27 },
      { title: 'Hurts starting QB · PHI', yes: 88.4, prints: 19 },
      { title: 'Cowboys win · DAL', yes: 39.2, prints: 14 },
      { title: 'Lamb 100+ rec yds', yes: 47.6, prints: 8 },
    ],
  },
  {
    key: 'CHI-GB',
    label: 'CHI vs GB',
    abs: ['CHI', 'GB'],
    flow: 280,
    markets: [
      { title: 'Bears win · CHI', yes: 41.3, prints: 16 },
      { title: 'Packers win · GB', yes: 58.9, prints: 15 },
      { title: 'Williams starting QB · CHI', yes: 72.5, prints: 9 },
      { title: 'Love 2+ TD passes', yes: 53.0, prints: 6 },
    ],
  },
] as const
