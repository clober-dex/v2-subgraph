import { BigInt } from '@graphprotocol/graph-ts'

import { OpenOrder } from '../../generated/schema'

export function encodeOrderID(
  bookID: string,
  tick: BigInt,
  orderIndex: BigInt,
): BigInt {
  const bookIDBigInt = BigInt.fromString(bookID)
  const tickU24 = BigInt.fromU32((tick.toU32() << 8) >> 8)
  return orderIndex
    .plus(tickU24.times(BigInt.fromI32(2).pow(40)))
    .plus(bookIDBigInt.times(BigInt.fromI32(2).pow(64)))
}

export function decodeBookIDFromOrderID(orderID: BigInt): string {
  return orderID.div(BigInt.fromI32(2).pow(64)).toString()
}

export function getPendingUnitAmount(openOrder: OpenOrder): BigInt {
  return openOrder.cancelableUnitAmount.plus(openOrder.claimableUnitAmount)
}
