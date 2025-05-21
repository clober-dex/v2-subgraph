import { getPoolOrLog, getTokenOrLog } from '../../common/entity-getters'
import { BI_18, ZERO_BD, ZERO_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import {
  updateDayData,
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
} from '../interval-updates'
import { getTokenUSDPriceFlat } from '../../common/pricing'
import { Burn } from '../../../generated/LiquidityVault/LiquidityVault'

export function handleBurn(event: Burn): void {
  updateDayData(event)

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
    const feeAInDecimals = convertTokenToDecimal(
      event.params.feeA,
      tokenA.decimals,
    )
    const priceAUSD = getTokenUSDPriceFlat(tokenA)
    const feeAInUSD = priceAUSD.times(feeAInDecimals)
    const amountBInDecimals = convertTokenToDecimal(
      event.params.amountB,
      tokenB.decimals,
    )
    const feeBInDecimals = convertTokenToDecimal(
      event.params.feeB,
      tokenB.decimals,
    )
    const priceBUSD = getTokenUSDPriceFlat(tokenB)
    const feeBInUSD = priceBUSD.times(feeBInDecimals)

    // update pool state
    pool.totalSupply = pool.totalSupply.minus(event.params.lpAmount)
    pool.liquidityA = pool.liquidityA.minus(event.params.amountA)
    pool.liquidityB = pool.liquidityB.minus(event.params.amountB)
    pool.protocolFeesTokenA = pool.protocolFeesTokenA.plus(feeAInDecimals)
    pool.protocolFeesTokenB = pool.protocolFeesTokenB.plus(feeBInDecimals)
    pool.protocolFeesAUSD = pool.protocolFeesAUSD.plus(feeAInUSD)
    pool.protocolFeesBUSD = pool.protocolFeesBUSD.plus(feeBInUSD)

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
    const poolHourData = updatePoolHourData(pool, event)
    const poolDayData = updatePoolDayData(pool, event)
    const tokenADayData = updateTokenDayData(tokenA, priceAUSD, event)
    const tokenBDayData = updateTokenDayData(tokenB, priceBUSD, event)

    poolHourData.protocolFeesTokenA =
      poolHourData.protocolFeesTokenA.plus(feeAInDecimals)
    poolHourData.protocolFeesTokenB =
      poolHourData.protocolFeesTokenB.plus(feeBInDecimals)
    poolHourData.protocolFeesAUSD =
      poolHourData.protocolFeesAUSD.plus(feeAInUSD)
    poolHourData.protocolFeesBUSD =
      poolHourData.protocolFeesBUSD.plus(feeBInUSD)

    poolDayData.protocolFeesTokenA =
      poolDayData.protocolFeesTokenA.plus(feeAInDecimals)
    poolDayData.protocolFeesTokenB =
      poolDayData.protocolFeesTokenB.plus(feeBInDecimals)
    poolDayData.protocolFeesAUSD = poolDayData.protocolFeesAUSD.plus(feeAInUSD)
    poolDayData.protocolFeesBUSD = poolDayData.protocolFeesBUSD.plus(feeBInUSD)

    tokenADayData.protocolFees = tokenADayData.protocolFees.plus(feeAInDecimals)
    tokenADayData.protocolFeesUSD =
      tokenADayData.protocolFeesUSD.plus(feeAInUSD)

    tokenBDayData.protocolFees = tokenBDayData.protocolFees.plus(feeBInDecimals)
    tokenBDayData.protocolFeesUSD =
      tokenBDayData.protocolFeesUSD.plus(feeBInUSD)

    poolHourData.save()
    poolDayData.save()
    tokenADayData.save()
    tokenBDayData.save()
    pool.save()
    tokenA.save()
    tokenB.save()
  }
}
