import { BigInt } from '@graphprotocol/graph-ts'

import { PRICE_PRECISION } from './tick'

export function unitToBase(
  unitSize: BigInt,
  unitAmount: BigInt,
  price: BigInt,
): BigInt {
  if (price.isZero()) {
    return BigInt.fromI32(0)
  }
  return unitAmount.times(unitSize).times(PRICE_PRECISION).div(price)
}

export function unitToQuote(unitSize: BigInt, unitAmount: BigInt): BigInt {
  return unitAmount.times(unitSize)
}
