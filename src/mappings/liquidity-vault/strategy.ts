import { BigInt } from '@graphprotocol/graph-ts'

import { getPoolOrLog, getTokenOrLog } from '../../common/entity-getters'
import {
  formatInvertedPrice,
  formatPrice,
  tickToPrice,
} from '../../common/tick'
import { BI_18, ZERO_BD, ZERO_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { UpdatePosition } from '../../../generated/SimpleOracleStrategy/SimpleOracleStrategy'
import { getTokenUSDPriceFlat } from '../../common/pricing'

export function handleUpdatePosition(event: UpdatePosition): void {
  const pool = getPoolOrLog(event.params.key, 'UPDATE_POSITION')
  if (!pool) {
    return
  }
  const tokenA = getTokenOrLog(pool.tokenA, 'UPDATE_POSITION')
  const tokenB = getTokenOrLog(pool.tokenB, 'UPDATE_POSITION')

  if (tokenA && tokenB) {
    pool.oraclePrice = event.params.oraclePrice

    pool.tickA = BigInt.fromI32(event.params.tickA)
    pool.priceARaw = tickToPrice(event.params.tickA)
    pool.priceA = formatPrice(pool.priceARaw, tokenB.decimals, tokenA.decimals)

    pool.tickB = BigInt.fromI32(event.params.tickB)
    pool.priceBRaw = tickToPrice(event.params.tickB)
    pool.priceB = formatInvertedPrice(
      pool.priceBRaw,
      tokenA.decimals,
      tokenB.decimals,
    )

    const tokenAUSDPrice = getTokenUSDPriceFlat(tokenA)
    const tokenBUSDPrice = getTokenUSDPriceFlat(tokenB)
    const initialLpAmountDecimal = convertTokenToDecimal(
      pool.initialTotalSupply,
      BI_18, // assuming LP token has 18 decimals
    )
    if (
      pool.initialLPPriceUSD.equals(ZERO_BD) &&
      initialLpAmountDecimal.gt(ZERO_BD) &&
      pool.initialTokenAAmount.gt(ZERO_BI) &&
      pool.initialTokenBAmount.gt(ZERO_BI)
    ) {
      const amountAInUSD = convertTokenToDecimal(
        pool.initialTokenAAmount,
        tokenA.decimals,
      ).times(tokenAUSDPrice)
      const amountBInUSD = convertTokenToDecimal(
        pool.initialTokenBAmount,
        tokenB.decimals,
      ).times(tokenBUSDPrice)
      pool.initialLPPriceUSD = amountAInUSD
        .plus(amountBInUSD)
        .div(initialLpAmountDecimal)
    }

    // const lpAmountDecimal = convertTokenToDecimal(
    //   pool.totalSupply,
    //   BI_18, // assuming LP token has 18 decimals
    // )
    // if (lpAmountDecimal.gt(ZERO_BD)) {
    //   const amountAInUSD = convertTokenToDecimal(
    //     pool.liquidityA,
    //     tokenA.decimals,
    //   ).times(tokenAUSDPrice)
    //   const amountBInUSD = convertTokenToDecimal(
    //     pool.liquidityB,
    //     tokenB.decimals,
    //   ).times(tokenBUSDPrice)
    //   pool.lpPriceUSD = amountAInUSD.plus(amountBInUSD).div(lpAmountDecimal)
    //   pool.totalValueLockedUSD = pool.lpPriceUSD.times(lpAmountDecimal)
    // }

    pool.save()
  }
}
