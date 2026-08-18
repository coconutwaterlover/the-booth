'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useProphecy, WalletBalance } from '@prophecy-dev/connect-react'

export function WalletButton() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <WalletButtonInner />
}

function WalletButtonInner() {
  const { ready, authenticated, login, logout, user } = usePrivy()
  const { owner } = useProphecy()
  if (!ready) return null
  const addr =
    owner ??
    (user?.linkedAccounts?.find((a) => (a as { type?: string }).type === 'smart_wallet') as { address?: string } | undefined)
      ?.address ??
    null
  return authenticated ? (
    <div className="booth-header__session">
      <WalletBalance wallet={owner} claim className="booth-wallet-balance" />
      <button type="button" className="booth-chip" onClick={() => void logout()}>
        {addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : 'Signed in'} · Out
      </button>
    </div>
  ) : (
    <button type="button" className="booth-chip booth-chip--live" onClick={() => login()}>
      Sign in
    </button>
  )
}
