import { log } from '@graphprotocol/graph-ts'

import { FeeCollected, Swap } from '../../generated/RouterGateway/RouterGateway'
import {
  RouterDayData,
  Swap as SwapEntity,
  Token,
} from '../../generated/schema'
import { ONE_BI, ZERO_BD, ZERO_BI } from '../common/constants'
import { calculateValueUSD, getTokenUSDPriceFlat } from '../common/pricing'
import { convertTokenToDecimal } from '../common/utils'
import { SKIP_TAKE_AND_SWAP } from '../common/chain'

import {
  updateDayData,
  updateTokenDayData,
  updateUserDayVolume,
  updateUserNativeVolume,
} from './interval-updates'

export function handleSwap(event: Swap): void {
  updateDayData(event, 'SWAP')

  const inputToken = Token.load(event.params.inToken)
  const outputToken = Token.load(event.params.outToken)

  const swap = new SwapEntity(
    event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.logIndex.toString()),
  )
  swap.transaction = event.transaction.hash.toHexString()
  swap.timestamp = event.block.timestamp
  swap.inputToken = event.params.inToken
  swap.outputToken = event.params.outToken
  swap.origin = event.transaction.from
  swap.inputAmount = event.params.amountIn
  swap.outputAmount = event.params.amountOut
  swap.router = event.params.router
  swap.fee = ZERO_BI
  if (
    inputToken &&
    outputToken &&
    swap.inputAmount.ge(ZERO_BI) &&
    swap.outputAmount.ge(ZERO_BI)
  ) {
    const inputAmountDecimal = convertTokenToDecimal(
      swap.inputAmount,
      inputToken.decimals,
    )
    const outputAmountDecimal = convertTokenToDecimal(
      swap.outputAmount,
      outputToken.decimals,
    )
    const priceIn = getTokenUSDPriceFlat(inputToken)
    const priceOut = getTokenUSDPriceFlat(outputToken)

    swap.amountUSD = calculateValueUSD(
      inputAmountDecimal,
      priceIn,
      outputAmountDecimal,
      priceOut,
    )

    if (priceIn.gt(ZERO_BD)) {
      updateUserDayVolume(inputToken, event, inputAmountDecimal, swap.amountUSD)
      const inputTokenDayData = updateTokenDayData(inputToken, priceIn, event)
      inputTokenDayData.volume =
        inputTokenDayData.volume.plus(inputAmountDecimal)
      inputTokenDayData.volumeUSD = inputTokenDayData.volumeUSD.plus(
        swap.amountUSD,
      )
      inputTokenDayData.save()
    } else if (priceOut.gt(ZERO_BD)) {
      updateUserDayVolume(
        outputToken,
        event,
        outputAmountDecimal,
        swap.amountUSD,
      )
      const outputTokenDayData = updateTokenDayData(
        outputToken,
        priceOut,
        event,
      )
      outputTokenDayData.volume =
        outputTokenDayData.volume.plus(outputAmountDecimal)
      outputTokenDayData.volumeUSD = outputTokenDayData.volumeUSD.plus(
        swap.amountUSD,
      )
      outputTokenDayData.save()
    }
    updateUserNativeVolume(
      event,
      swap.inputToken,
      swap.outputToken,
      swap.inputAmount,
      swap.outputAmount,
    )
  } else {
    log.warning(
      'Swap USD skipped: inputToken or outputToken missing or invalid amounts. tx: {}',
      [event.transaction.hash.toHexString()],
    )
    swap.amountUSD = ZERO_BD
  }
  swap.logIndex = event.logIndex
  if (!SKIP_TAKE_AND_SWAP) {
    swap.save()

    const dayID = swap.timestamp.toI32() / 86400 // rounded
    const routerDayID = swap.router
      .toHexString()
      .concat('-')
      .concat(dayID.toString())
    let routerDayData = RouterDayData.load(routerDayID)
    if (routerDayData === null) {
      routerDayData = new RouterDayData(routerDayID)
      routerDayData.date = dayID
      routerDayData.cloberDayData = dayID.toString()
      routerDayData.router = swap.router
      routerDayData.txCount = ZERO_BI
    }
    routerDayData.txCount = routerDayData.txCount.plus(ONE_BI)
    routerDayData.save()
  }
}

export function handleFeeCollected(event: FeeCollected): void {
  const swap = SwapEntity.load(
    event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.logIndex.minus(ONE_BI).toString()),
  )
  const token = Token.load(event.params.token)
  if (swap && token) {
    const price = getTokenUSDPriceFlat(token)
    const feeAmountDecimal = convertTokenToDecimal(
      event.params.amount,
      token.decimals,
    )
    const tokenDayData = updateTokenDayData(token, price, event)
    tokenDayData.protocolFees = tokenDayData.protocolFees.plus(feeAmountDecimal)
    tokenDayData.protocolFeesUSD = tokenDayData.protocolFeesUSD.plus(
      feeAmountDecimal.times(price),
    )

    swap.fee = event.params.amount

    swap.save()
    tokenDayData.save()
  }
}
