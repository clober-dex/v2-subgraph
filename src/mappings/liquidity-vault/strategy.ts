import { getPoolOrLog, getTokenOrLog } from '../../common/entity-getters'
import {
  formatInvertedPrice,
  formatPrice,
  tickToPrice,
} from '../../common/tick'
import { BI_18, ZERO_BD, ZERO_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { getTokenUSDPrice } from '../../common/pricing'
import { UpdatePosition } from '../../../generated/SimpleOracleStrategy/SimpleOracleStrategy'

export function handleUpdatePosition(event: UpdatePosition): void {
  const pool = getPoolOrLog(event.params.key, 'UPDATE_POSITION')
  if (!pool) {
    return
  }
  const tokenA = getTokenOrLog(pool.tokenA, 'UPDATE_POSITION')
  const tokenB = getTokenOrLog(pool.tokenB, 'UPDATE_POSITION')

  if (tokenA && tokenB) {
    pool.oraclePrice = event.params.oraclePrice

    pool.tickA = event.params.tickA
    pool.priceARaw = tickToPrice(event.params.tickA)
    pool.priceA = formatPrice(pool.priceARaw, tokenA.decimals, tokenB.decimals)

    pool.tickB = event.params.tickB
    pool.priceBRaw = tickToPrice(event.params.tickB)
    pool.priceB = formatInvertedPrice(
      pool.priceBRaw,
      tokenB.decimals,
      tokenA.decimals,
    )

    if (
      pool.initialLPPriceUSD.equals(ZERO_BD) &&
      pool.totalSupply.gt(ZERO_BI) &&
      pool.initialTokenAAmount.gt(ZERO_BI) &&
      pool.initialTokenBAmount.gt(ZERO_BI)
    ) {
      const quotePrice = getTokenUSDPrice(tokenA)
      const lpAmountDecimal = convertTokenToDecimal(pool.totalSupply, BI_18) // assuming LP token has 18 decimals
      const tokenAInUSD = convertTokenToDecimal(
        pool.initialTokenAAmount,
        tokenA.decimals,
      ).times(quotePrice)
      const tokenBInUSD = convertTokenToDecimal(
        pool.initialTokenBAmount,
        tokenB.decimals,
      ).times(pool.priceA)
      pool.initialLPPriceUSD = tokenAInUSD
        .plus(tokenBInUSD)
        .div(lpAmountDecimal)
    }

    pool.save()
  }
}
