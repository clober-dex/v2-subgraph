import {
  store,
  BigDecimal,
  Bytes,
  BigInt,
  Address,
} from '@graphprotocol/graph-ts'

import { Transfer } from '../../../generated/LiquidityVault/LiquidityVault'
import { updateDayData } from '../interval-updates'
import {
  getOrCreateUserPoolBalance,
  getPoolOrLog,
  getTokenOrLog,
} from '../../common/entity-getters'
import {
  ADDRESS_ZERO,
  BI_18,
  BI_8,
  ONE_BD,
  ZERO_BD,
  ZERO_BI,
} from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { UserPoolBalance } from '../../../generated/schema'
import { isStableCoin } from '../../common/token'

function buyLpToken(
  userPoolBalance: UserPoolBalance,
  amount: BigInt,
  lpPriceUSD: BigDecimal,
): void {
  const costToAdd = convertTokenToDecimal(amount, BI_18).times(lpPriceUSD)
  userPoolBalance.lpBalance = userPoolBalance.lpBalance.plus(amount)
  userPoolBalance.costBasisUSD = userPoolBalance.costBasisUSD.plus(costToAdd)

  const lpBalanceBD = convertTokenToDecimal(userPoolBalance.lpBalance, BI_18)
  userPoolBalance.lpBalanceUSD = lpBalanceBD.times(lpPriceUSD)

  userPoolBalance.averageLPPriceUSD = userPoolBalance.lpBalance.gt(ZERO_BI)
    ? userPoolBalance.costBasisUSD.div(lpBalanceBD)
    : ZERO_BD

  if (userPoolBalance.lpBalance.equals(ZERO_BI)) {
    store.remove('UserPoolBalance', userPoolBalance.id)
  } else {
    userPoolBalance.save()
  }
}

function sellLpToken(
  userPoolBalance: UserPoolBalance,
  amount: BigInt,
  lpPriceUSD: BigDecimal,
): void {
  userPoolBalance.lpBalance = userPoolBalance.lpBalance.minus(amount)
  userPoolBalance.lpBalanceUSD = convertTokenToDecimal(
    userPoolBalance.lpBalance,
    BI_18,
  ).times(lpPriceUSD)

  if (userPoolBalance.lpBalance.equals(ZERO_BI)) {
    store.remove('UserPoolBalance', userPoolBalance.id)
  } else {
    userPoolBalance.save()
  }
}

export function handleTransfer(event: Transfer): void {
  updateDayData(event, 'TRANSFER')

  const key = Bytes.fromHexString(
    '0x' + event.params.id.toHexString().slice(2).padStart(64, '0'),
  )
  const pool = getPoolOrLog(key, 'TRANSFER')
  if (
    !pool ||
    event.params.amount.equals(ZERO_BI) ||
    event.params.from.equals(event.params.to)
  ) {
    return
  }

  const tokenA = getTokenOrLog(pool.tokenA, 'TRANSFER')
  const tokenB = getTokenOrLog(pool.tokenB, 'TRANSFER')
  if (!tokenA || !tokenB) {
    return
  }

  const oraclePrice = convertTokenToDecimal(pool.oraclePrice, BI_8)
  const tokenAUSDPrice = isStableCoin(Address.fromBytes(tokenA.id))
    ? ONE_BD
    : oraclePrice
  const tokenBUSDPrice = isStableCoin(Address.fromBytes(tokenB.id))
    ? ONE_BD
    : oraclePrice

  const isMint = event.params.from.equals(Bytes.fromHexString(ADDRESS_ZERO))
  const isBurn = event.params.to.equals(Bytes.fromHexString(ADDRESS_ZERO))
  const isTransfer = !isMint && !isBurn

  const liquidityAInUSD = convertTokenToDecimal(
    pool.liquidityA,
    tokenA.decimals,
  ).times(tokenAUSDPrice)
  const liquidityBInUSD = convertTokenToDecimal(
    pool.liquidityB,
    tokenB.decimals,
  ).times(tokenBUSDPrice)
  const totalSupply = convertTokenToDecimal(pool.totalSupply, BI_18)
  const lpPriceUSD =
    oraclePrice.gt(ZERO_BD) && totalSupply.gt(ZERO_BD)
      ? liquidityAInUSD.plus(liquidityBInUSD).div(totalSupply)
      : pool.lpPriceUSD

  if (isMint) {
    buyLpToken(
      getOrCreateUserPoolBalance(event.params.to, key, event),
      event.params.amount,
      lpPriceUSD,
    )
  } else if (isBurn) {
    sellLpToken(
      getOrCreateUserPoolBalance(event.params.from, key, event),
      event.params.amount,
      lpPriceUSD,
    )
  } else if (
    isTransfer &&
    !event.params.from.equals(event.params.to) &&
    !event.params.from.equals(Bytes.fromHexString(ADDRESS_ZERO)) &&
    !event.params.to.equals(Bytes.fromHexString(ADDRESS_ZERO))
  ) {
    sellLpToken(
      getOrCreateUserPoolBalance(event.params.from, key, event),
      event.params.amount,
      lpPriceUSD,
    )
    buyLpToken(
      getOrCreateUserPoolBalance(event.params.to, key, event),
      event.params.amount,
      lpPriceUSD,
    )
  }
}
