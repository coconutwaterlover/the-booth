'use client'

import { PriceChart, TradePulse } from '@prophecy-dev/connect-react'

export function BoothSpark({
  marketId,
  height = 32,
  label = 'PX',
}: {
  marketId: string
  height?: number
  label?: string
}) {
  return (
    <div className="booth-spark" data-height={height}>
      <span className="booth-spark__label">{label}</span>
      <TradePulse market={marketId}>
        <PriceChart
          market={marketId}
          outcomes={[0]}
          live
          height={height}
          showGrid={false}
          showLegend={false}
          className="booth-spark__chart"
        />
      </TradePulse>
    </div>
  )
}
