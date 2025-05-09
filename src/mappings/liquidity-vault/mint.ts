import { Mint } from '../../../generated/Rebalancer/Rebalancer'
import { getPoolOrLog, getTokenOrLog } from '../../common/entity-getters'
import { BI_18, ZERO_BD, ZERO_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { getTokenUSDPrice } from '../../common/pricing'
import {
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
} from '../interval-updates'

export function handleMint(event: Mint): void {
  const pool = getPoolOrLog(event.params.key, 'MINT')
  if (!pool || event.params.lpAmount.equals(ZERO_BI)) {
    return
  }

  const tokenA = getTokenOrLog(pool.tokenA, 'MINT')
  const tokenB = getTokenOrLog(pool.tokenB, 'MINT')

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
    const amountUSD = amountAInDecimals
      .times(priceAUSD)
      .plus(amountBInDecimals.times(priceBUSD))

    if (pool.initialTokenAAmount.isZero()) {
      pool.initialTokenAAmount = event.params.amountA
    }
    if (pool.initialTokenBAmount.isZero()) {
      pool.initialTokenBAmount = event.params.amountB
    }
    if (pool.initialTotalSupply.isZero()) {
      pool.initialTotalSupply = event.params.lpAmount
    }
    if (pool.initialLPPriceUSD.equals(ZERO_BD)) {
      const lpAmountDecimal = convertTokenToDecimal(
        event.params.lpAmount,
        BI_18,
      ) // assuming LP token has 18 decimals
      pool.initialLPPriceUSD = amountUSD.div(lpAmountDecimal)
    }

    // update pool state
    pool.totalSupply = pool.totalSupply.plus(event.params.lpAmount)
    pool.liquidityA = pool.liquidityA.plus(event.params.amountA)
    pool.liquidityB = pool.liquidityB.plus(event.params.amountB)

    // update token state
    tokenA.totalValueLocked = tokenA.totalValueLocked.plus(amountAInDecimals)
    tokenA.totalValueLockedUSD = tokenA.totalValueLockedUSD.plus(
      amountAInDecimals.times(priceAUSD),
    )
    tokenB.totalValueLocked = tokenB.totalValueLocked.plus(amountBInDecimals)
    tokenB.totalValueLockedUSD = tokenB.totalValueLockedUSD.plus(
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
