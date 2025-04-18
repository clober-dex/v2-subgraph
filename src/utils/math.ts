import { BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts'

import { Book, OpenOrder } from '../../generated/schema'

export const pricePrecision = BigInt.fromI32(2).pow(96)

export function normalizeDailyTimestamp(timestamp: BigInt): BigInt {
  return timestamp.minus(timestamp.mod(BigInt.fromI32(86400)))
}

export function getPendingAmount(openOrder: OpenOrder): BigInt {
  return openOrder.unitOpenAmount.plus(openOrder.unitClaimableAmount)
}

export function unitToBase(
  book: Book,
  unitAmount: BigInt,
  price: BigInt,
): BigInt {
  if (price.isZero()) {
    return BigInt.fromI32(0)
  }
  return unitAmount.times(book.unitSize).times(pricePrecision).div(price)
}

export function unitToQuote(book: Book, unitAmount: BigInt): BigInt {
  return unitAmount.times(book.unitSize)
}

export function baseToQuote(baseAmount: BigInt, price: BigInt): BigInt {
  return baseAmount.times(price).div(pricePrecision)
}

export function formatPrice(
  price: BigInt,
  baseDecimals: BigInt,
  quoteDecimals: BigInt,
): BigDecimal {
  return BigDecimal.fromString(price.toString())
    .div(pricePrecision.toBigDecimal())
    .times(
      BigDecimal.fromString(
        BigInt.fromI32(10)
          .pow(baseDecimals.toI32() as u8)
          .toString(),
      ),
    )
    .div(
      BigDecimal.fromString(
        BigInt.fromI32(10)
          .pow(quoteDecimals.toI32() as u8)
          .toString(),
      ),
    )
}

export function formatInvertedPrice(
  price: BigInt,
  baseDecimals: BigInt,
  quoteDecimals: BigInt,
): BigDecimal {
  if (price.isZero()) {
    return BigDecimal.fromString('0')
  }
  return BigDecimal.fromString('1').div(
    formatPrice(price, baseDecimals, quoteDecimals),
  )
}

export function formatUnits(
  amount: BigInt,
  decimals: u8 = 18 as u8,
): BigDecimal {
  return BigDecimal.fromString(amount.toString()).div(
    BigDecimal.fromString(BigInt.fromI32(10).pow(decimals).toString()),
  )
}

export function bytesToBigIntBigEndian(bytes: Bytes): BigInt {
  let value = BigInt.fromI32(0)
  for (let i = 0; i < bytes.length; i++) {
    value = value.times(BigInt.fromI32(256)).plus(BigInt.fromI32(bytes[i]))
  }
  return value
}
