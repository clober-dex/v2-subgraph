import { ethereum, log } from '@graphprotocol/graph-ts'

import { Swap } from '../../../generated/RouterGateway/RouterGateway'
import {
  Swap as SwapEntity,
  Take as TakeEntity,
} from '../../../generated/schema'
import { ZERO_BI } from '../../common/constants'

const TAKE_EVENT_TOPIC =
  '0xc4c20b9c4a5ada3b01b7a391a08dd81a1be01dd8ef63170dd9da44ecee3db11b'

export function handleSwap(event: Swap): void {
  const precedingTakeLogs = (
    event.receipt as ethereum.TransactionReceipt
  ).logs.filter((log) => log.topics[0].toHexString() == TAKE_EVENT_TOPIC)

  let bookTakenIn = ZERO_BI
  let bookTakenOut = ZERO_BI
  for (let i = 1; i <= precedingTakeLogs.length; i++) {
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
  swap.logIndex = event.logIndex
  swap.save()

  if (swap.inputAmount.lt(ZERO_BI)) {
    log.error('Swap input amount is negative: {}', [swap.id.toString()])
  }
  if (swap.outputAmount.lt(ZERO_BI)) {
    log.error('Swap output amount is negative: {}', [swap.id.toString()])
  }
}
