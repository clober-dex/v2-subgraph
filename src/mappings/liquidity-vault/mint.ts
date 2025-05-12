import { Mint } from '../../../generated/Rebalancer/Rebalancer'
import {
  getOrCreateTransaction,
  getPoolOrLog,
  getTokenOrLog,
} from '../../common/entity-getters'
import { ZERO_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { getTokenUSDPrice } from '../../common/pricing'
import {
  updateDayData,
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

    if (pool.initialTokenAAmount.isZero()) {
      pool.initialTokenAAmount = event.params.amountA
    }
    if (pool.initialTokenBAmount.isZero()) {
      pool.initialTokenBAmount = event.params.amountB
    }
    if (pool.initialTotalSupply.isZero()) {
      pool.initialTotalSupply = event.params.lpAmount
      pool.initialMintTransaction = getOrCreateTransaction(event).id
    }

    // update pool state
    pool.totalSupply = pool.totalSupply.plus(event.params.lpAmount)
    pool.liquidityA = pool.liquidityA.plus(event.params.amountA)
    pool.liquidityB = pool.liquidityB.plus(event.params.amountB)

    // update token state
    tokenA.totalValueLocked = tokenA.totalValueLocked.plus(amountAInDecimals)
    tokenA.totalValueLockedUSD = tokenA.totalValueLocked.times(priceAUSD)
    tokenB.totalValueLocked = tokenB.totalValueLocked.plus(amountBInDecimals)
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
