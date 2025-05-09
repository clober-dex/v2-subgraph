import { BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts'

import {
  Book,
  Depth,
  OpenOrder,
  Token,
  Transaction,
} from '../../generated/schema'

export function getOrCreateTransaction(event: ethereum.Event): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString())
  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString())
  }
  transaction.blockNumber = event.block.number
  transaction.timestamp = event.block.timestamp
  transaction.gasUsed = BigInt.zero() //needs to be moved to transaction receipt
  transaction.gasPrice = event.transaction.gasPrice
  transaction.from = event.transaction.from
  transaction.to = event.transaction.to
  transaction.value = event.transaction.value
  transaction.save()
  return transaction as Transaction
}

export function getTokenOrLog(tokenID: Bytes, eventType: string): Token | null {
  const token = Token.load(tokenID)
  if (token === null) {
    log.error('[{}] Token not found: {}', [eventType, tokenID.toHexString()])
  }
  return token
}

export function getBookOrLog(bookID: string, eventType: string): Book | null {
  const book = Book.load(bookID)
  if (book === null) {
    log.error('[{}] Book not found: {}', [eventType, bookID])
  }
  return book
}

export function getDepthOrLog(
  depthID: string,
  eventType: string,
): Depth | null {
  const depth = Depth.load(depthID)
  if (depth === null) {
    log.error('[{}] Depth not found: {}', [eventType, depthID])
  }
  return depth
}

export function getOpenOrderOrLog(
  openOrderID: string,
  eventType: string,
): OpenOrder | null {
  const openOrder = OpenOrder.load(openOrderID)
  if (openOrder === null) {
    log.error('[{}] Open order not found: {}', [eventType, openOrderID])
  }
  return openOrder
}

// export function getPoolOrLog(
//   orderId: string,
//   eventType: string,
// ): OpenOrder | null {
//   const openOrder = OpenOrder.load(orderId)
//   if (openOrder === null) {
//     log.error('[{}] Open order not found: {}', [eventType, orderId])
//   }
//   return openOrder
// }
