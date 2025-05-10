import { Burn } from '../../../generated/Rebalancer/Rebalancer'
import { getPoolOrLog, getTokenOrLog } from '../../common/entity-getters'
import { ZERO_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { getTokenUSDPrice } from '../../common/pricing'
import {
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
} from '../interval-updates'

export function handleBurn(event: Burn): void {
  const pool = getPoolOrLog(event.params.key, 'BURN')
  if (!pool || event.params.lpAmount.equals(ZERO_BI)) {
    return
  }

  const tokenA = getTokenOrLog(pool.tokenA, 'BURN')
  const tokenB = getTokenOrLog(pool.tokenB, 'BURN')

  if (tokenA && tokenB) {
    const amountAInDecimals = convertTokenToDecimal(
      event.params.amountA,
      tokenA.decimals,
    )
    const priceAUSD = getTokenUSDPrice(tokenA)
    const amountBInDecimals = convertTokenToDecimal(
      event.params.amountB,
      tokenB.decimals,
    )
    const priceBUSD = getTokenUSDPrice(tokenB)

    // update pool state
    pool.totalSupply = pool.totalSupply.minus(event.params.lpAmount)
    pool.liquidityA = pool.liquidityA.minus(event.params.amountA)
    pool.liquidityB = pool.liquidityB.minus(event.params.amountB)

    // update token state
    tokenA.totalValueLocked = tokenA.totalValueLocked.minus(amountAInDecimals)
    tokenA.totalValueLockedUSD = tokenA.totalValueLockedUSD.minus(
      amountAInDecimals.times(priceAUSD),
    )
    tokenB.totalValueLocked = tokenB.totalValueLocked.minus(amountBInDecimals)
    tokenB.totalValueLockedUSD = tokenB.totalValueLockedUSD.minus(
      amountBInDecimals.times(priceBUSD),
    )

    // update interval
    updatePoolHourData(pool, event)
    updatePoolDayData(pool, event)
    updateTokenDayData(tokenA, priceAUSD, event)
    updateTokenDayData(tokenB, priceBUSD, event)

    pool.save()
    tokenA.save()
    tokenB.save()
  }
}
