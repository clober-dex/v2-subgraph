import { BigDecimal, Bytes } from '@graphprotocol/graph-ts'

import { Transfer } from '../../../generated/LiquidityVault/LiquidityVault'
import { updateDayData } from '../interval-updates'
import {
  getOrCreateUserPoolBalance,
  getPoolOrLog,
} from '../../common/entity-getters'
import { ADDRESS_ZERO, BI_18, ZERO_BD, ZERO_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { UserPoolBalance } from '../../../generated/schema'

function updatePnL(userPoolBalance: UserPoolBalance): void {
  userPoolBalance.pnlUSD = userPoolBalance.lpBalanceUSD.minus(
    userPoolBalance.costBasisUSD,
  )
  userPoolBalance.save()
}

function buyLpToken(
  userPoolBalance: UserPoolBalance,
  amountBD: BigDecimal,
  lpPriceUSD: BigDecimal,
): void {
  const costToAdd = amountBD.times(lpPriceUSD)
  userPoolBalance.lpBalance = userPoolBalance.lpBalance.plus(amountBD)
  userPoolBalance.costBasisUSD = userPoolBalance.costBasisUSD.plus(costToAdd)
  userPoolBalance.lpBalanceUSD = userPoolBalance.lpBalance.times(lpPriceUSD)

  userPoolBalance.averageLPPriceUSD = userPoolBalance.lpBalance.gt(ZERO_BD)
    ? userPoolBalance.costBasisUSD.div(userPoolBalance.lpBalance)
    : ZERO_BD

  // Update PnL
  userPoolBalance.pnlUSD = userPoolBalance.lpBalanceUSD.minus(
    userPoolBalance.costBasisUSD,
  )

  userPoolBalance.save()
}

function sellLpToken(
  userPoolBalance: UserPoolBalance,
  amountBD: BigDecimal,
  lpPriceUSD: BigDecimal,
): void {
  userPoolBalance.lpBalance = userPoolBalance.lpBalance.minus(amountBD)
  userPoolBalance.lpBalanceUSD = userPoolBalance.lpBalance.times(lpPriceUSD)

  // Update PnL
  userPoolBalance.pnlUSD = userPoolBalance.lpBalanceUSD.minus(
    userPoolBalance.costBasisUSD,
  )

  userPoolBalance.save()
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

  const isMint = event.params.from.equals(Bytes.fromHexString(ADDRESS_ZERO))
  const isBurn = event.params.to.equals(Bytes.fromHexString(ADDRESS_ZERO))
  const isTransfer = !isMint && !isBurn

  const amountBD = convertTokenToDecimal(event.params.amount, BI_18)

  if (isMint) {
    buyLpToken(
      getOrCreateUserPoolBalance(event.params.to, key),
      amountBD,
      pool.lpPriceUSD,
    )
  } else if (isBurn) {
    sellLpToken(
      getOrCreateUserPoolBalance(event.params.from, key),
      amountBD,
      pool.lpPriceUSD,
    )
  } else if (isTransfer) {
    sellLpToken(
      getOrCreateUserPoolBalance(event.params.from, key),
      amountBD,
      pool.lpPriceUSD,
    )
    buyLpToken(
      getOrCreateUserPoolBalance(event.params.to, key),
      amountBD,
      pool.lpPriceUSD,
    )
  }
}
