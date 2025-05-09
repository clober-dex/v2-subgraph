import { BigInt } from '@graphprotocol/graph-ts'

import { OpenOrder } from '../../generated/schema'

export function encodeOrderId(
  bookId: string,
  tick: BigInt,
  orderIndex: BigInt,
): BigInt {
  const bookIdBigInt = BigInt.fromString(bookId)
  const tickU24 = BigInt.fromU32((tick.toU32() << 8) >> 8)
  return orderIndex
    .plus(tickU24.times(BigInt.fromI32(2).pow(40)))
    .plus(bookIdBigInt.times(BigInt.fromI32(2).pow(64)))
}

export function decodeBookIdFromOrderId(orderId: BigInt): string {
  return orderId.div(BigInt.fromI32(2).pow(64)).toString()
}

export function getPendingUnitAmount(openOrder: OpenOrder): BigInt {
  return openOrder.openUnitAmount.plus(openOrder.claimableUnitAmount)
}
