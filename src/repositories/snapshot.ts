import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import { LatestPoolSpread, PoolSpreadProfit } from '../../generated/schema'
import { CHART_LOG_INTERVALS, encodePoolSpreadProfitId } from '../utils'

export function getLatestPoolSpread(): LatestPoolSpread {
  const id = 'latest'
  let latestPoolSpread = LatestPoolSpread.load(id)
  if (latestPoolSpread === null) {
    latestPoolSpread = new LatestPoolSpread(id)
    latestPoolSpread.askTick = BigInt.fromI32(0)
    latestPoolSpread.bidTick = BigInt.fromI32(0)
    latestPoolSpread.askPrice = BigDecimal.zero()
    latestPoolSpread.bidPrice = BigDecimal.zero()
  }
  return latestPoolSpread as LatestPoolSpread
}

export function getPoolSpreadProfit(timestamp: BigInt): PoolSpreadProfit {
  const intervalEntry = CHART_LOG_INTERVALS.getEntry('5m')! // only use 5m interval for now
  const intervalType = intervalEntry.key
  const intervalInNumber = intervalEntry.value
  const timestampForAcc = (Math.floor(
    (timestamp.toI64() as number) / intervalInNumber,
  ) * intervalInNumber) as i64

  const poolSpreadProfitId = encodePoolSpreadProfitId(
    intervalType,
    timestampForAcc,
  )

  let poolSpreadProfit = PoolSpreadProfit.load(poolSpreadProfitId)
  if (poolSpreadProfit === null) {
    poolSpreadProfit = new PoolSpreadProfit(poolSpreadProfitId)
    poolSpreadProfit.intervalType = intervalType
    poolSpreadProfit.timestamp = BigInt.fromI64(timestampForAcc)
    poolSpreadProfit.accumulatedProfitInUsd = BigDecimal.zero()
  }
  return poolSpreadProfit as PoolSpreadProfit
}
