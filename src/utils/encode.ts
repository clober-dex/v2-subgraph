import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts'

import { Token } from '../../generated/schema'

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

export function encodeDepthId(bookId: string, tick: BigInt): string {
  return bookId.concat('-').concat(tick.toString())
}

export function encodeChartLogId(
  base: Token,
  quote: Token,
  intervalType: string,
  timestamp: i64,
): string {
  const marketCode = encodeMarketCode(base, quote)
  return marketCode
    .concat('-')
    .concat(intervalType)
    .concat('-')
    .concat(timestamp.toString())
}

export function encodePoolVolumeAndSnapshotId(
  poolKey: Bytes,
  intervalType: string,
  timestamp: i64,
): string {
  return poolKey
    .toHexString()
    .concat('-')
    .concat(intervalType)
    .concat('-')
    .concat(timestamp.toString())
}

export function encodePoolSpreadProfitId(
  intervalType: string,
  timestamp: i64,
): string {
  return intervalType.concat('-').concat(timestamp.toString())
}

export function encodeTokenBalanceId(holder: Address, token: Token): string {
  return holder.toHexString().concat('-').concat(token.id)
}

export function encodeMarketCode(base: Token, quote: Token): string {
  return base.id.concat('/').concat(quote.id)
}
