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

export function getTokenOrLog(tokenId: Bytes, eventType: string): Token | null {
  const token = Token.load(tokenId)
  if (token === null) {
    log.error('[{}] Token not found: {}', [eventType, tokenId.toHexString()])
  }
  return token
}

export function getBookOrLog(bookId: string, eventType: string): Book | null {
  const book = Book.load(bookId)
  if (book === null) {
    log.error('[{}] Book not found: {}', [eventType, bookId])
  }
  return book
}

export function getDepthOrLog(
  depthId: string,
  eventType: string,
): Depth | null {
  const depth = Depth.load(depthId)
  if (depth === null) {
    log.error('[{}] Depth not found: {}', [eventType, depthId])
  }
  return depth
}

export function getOpenOrderOrLog(
  orderId: string,
  eventType: string,
): OpenOrder | null {
  const openOrder = OpenOrder.load(orderId)
  if (openOrder === null) {
    log.error('[{}] Open order not found: {}', [eventType, orderId])
  }
  return openOrder
}
