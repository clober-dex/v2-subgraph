import {
  getOrCreateTransaction,
  getOrCreateUserPoolBalance,
  getPoolOrLog,
  getTokenOrLog,
} from '../../common/entity-getters'
import { BI_18, ZERO_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import {
  updateDayData,
  updatePoolDayData,
  updatePoolHourData,
} from '../interval-updates'
import { getTokenUSDPriceFlat } from '../../common/pricing'
import { Mint } from '../../../generated/LiquidityVault/LiquidityVault'

export function handleMint(event: Mint): void {
  updateDayData(event, 'MINT')

  const pool = getPoolOrLog(event.params.key, 'MINT')
  if (!pool || event.params.lpAmount.equals(ZERO_BI)) {
    return
  }

  const tokenA = getTokenOrLog(pool.tokenA, 'MINT')
  const tokenB = getTokenOrLog(pool.tokenB, 'MINT')

  if (tokenA && tokenB) {
    const priceAUSD = getTokenUSDPriceFlat(tokenA)
    const priceBUSD = getTokenUSDPriceFlat(tokenB)

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

    const lpAmountDecimal = convertTokenToDecimal(
      pool.totalSupply,
      BI_18, // assuming LP token has 18 decimals
    )
    const liquidityAInUSD = convertTokenToDecimal(
      pool.liquidityA,
      tokenA.decimals,
    ).times(priceAUSD)
    const liquidityBInUSD = convertTokenToDecimal(
      pool.liquidityB,
      tokenB.decimals,
    ).times(priceBUSD)
    pool.lpPriceUSD = liquidityAInUSD.plus(liquidityBInUSD).div(lpAmountDecimal)
    pool.totalValueLockedUSD = lpAmountDecimal.times(pool.lpPriceUSD)

    const userPoolBalance = getOrCreateUserPoolBalance(
      event.transaction.from,
      pool.id,
      event,
    )

    userPoolBalance.totalTokenADeposited =
      userPoolBalance.totalTokenADeposited.plus(event.params.amountA)
    userPoolBalance.totalTokenBDeposited =
      userPoolBalance.totalTokenBDeposited.plus(event.params.amountB)
    userPoolBalance.lpBalance = userPoolBalance.lpBalance.plus(
      event.params.lpAmount,
    )
    userPoolBalance.save()

    // @dev: To calculate the protocol's TVL, we need token.totalValueLocked + pool.totalValueLockedUSD
    // tokenA.totalValueLocked = tokenA.totalValueLocked.plus(amountAInDecimals)
    // tokenA.totalValueLockedUSD = tokenA.totalValueLocked.times(priceAUSD)
    // tokenB.totalValueLocked = tokenB.totalValueLocked.plus(amountBInDecimals)
    // tokenB.totalValueLockedUSD = tokenB.totalValueLocked.times(priceBUSD)

    // update interval
    updatePoolHourData(pool, event)
    updatePoolDayData(pool, event)

    pool.save()
  }
}
