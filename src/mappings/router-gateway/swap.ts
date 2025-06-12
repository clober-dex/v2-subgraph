import { ethereum, log } from '@graphprotocol/graph-ts'

import { Swap } from '../../../generated/RouterGateway/RouterGateway'
import {
  Swap as SwapEntity,
  Take as TakeEntity,
  Token,
} from '../../../generated/schema'
import { ZERO_BD, ZERO_BI } from '../../common/constants'
import { calculateValueUSD, getTokenUSDPriceFlat } from '../../common/pricing'
import { convertTokenToDecimal } from '../../common/utils'
import {
  updateDayData,
  updateUserDayVolume,
  updateUserNativeVolume,
} from '../interval-updates'
import { SKIP_TAKE_AND_SWAP } from '../../common/chain'

const TAKE_EVENT_TOPIC =
  '0xc4c20b9c4a5ada3b01b7a391a08dd81a1be01dd8ef63170dd9da44ecee3db11b'

export function handleSwap(event: Swap): void {
  updateDayData(event)

  const precedingTakeLogs = (
    event.receipt as ethereum.TransactionReceipt
  ).logs.filter((log) => log.topics[0].toHexString() == TAKE_EVENT_TOPIC)

  let bookTakenIn = ZERO_BI
  let bookTakenOut = ZERO_BI
  for (let i = 0; i < precedingTakeLogs.length; i++) {
    const log = precedingTakeLogs[i]
    const takeID = event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(log.logIndex.toString())
    const take = TakeEntity.load(takeID)
    if (
      take &&
      event.params.inToken.equals(take.inputToken) &&
      event.params.outToken.equals(take.outputToken)
    ) {
      bookTakenIn = bookTakenIn.plus(take.inputAmount)
      bookTakenOut = bookTakenOut.plus(take.outputAmount)
    }
  }

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
  swap.inputAmount = event.params.amountIn.minus(bookTakenIn)
  swap.outputAmount = event.params.amountOut.minus(bookTakenOut)
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
    } else if (priceOut.gt(ZERO_BD)) {
      updateUserDayVolume(
        outputToken,
        event,
        outputAmountDecimal,
        swap.amountUSD,
      )
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
  }

  if (swap.inputAmount.lt(ZERO_BI)) {
    log.error('Swap input amount is negative: {}', [swap.id.toString()])
  }
  if (swap.outputAmount.lt(ZERO_BI)) {
    log.error('Swap output amount is negative: {}', [swap.id.toString()])
  }
}
