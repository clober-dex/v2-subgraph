import { Burn } from '../../../generated/Rebalancer/Rebalancer'
import { getPoolOrLog, getTokenOrLog } from '../../common/entity-getters'
import { BI_18, ZERO_BD, ZERO_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { getTokenUSDPrice } from '../../common/pricing'
import {
  updateDayData,
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

    const lpAmountDecimal = convertTokenToDecimal(
      pool.totalSupply,
      BI_18, // assuming LP token has 18 decimals
    )
    if (lpAmountDecimal.gt(ZERO_BD)) {
      const amountAInUSD = convertTokenToDecimal(
        pool.liquidityA,
        tokenA.decimals,
      ).times(priceAUSD)
      const amountBInUSD = convertTokenToDecimal(
        pool.liquidityB,
        tokenB.decimals,
      ).times(priceBUSD)
      pool.lpPriceUSD = amountAInUSD.plus(amountBInUSD).div(lpAmountDecimal)
      pool.totalValueLockedUSD = lpAmountDecimal.times(pool.lpPriceUSD)
    }

    // update token state
    tokenA.totalValueLocked = tokenA.totalValueLocked.minus(amountAInDecimals)
    tokenA.totalValueLockedUSD = tokenA.totalValueLocked.times(priceAUSD)
    tokenB.totalValueLocked = tokenB.totalValueLocked.minus(amountBInDecimals)
    tokenB.totalValueLockedUSD = tokenB.totalValueLocked.times(priceBUSD)

    // update interval
    updateDayData(event)
    updatePoolHourData(pool, event)
    updatePoolDayData(pool, event)
    updateTokenDayData(tokenA, priceAUSD, event)
    updateTokenDayData(tokenB, priceBUSD, event)

    pool.save()
    tokenA.save()
    tokenB.save()
  }
}
