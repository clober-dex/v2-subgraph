import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'

import { Open } from '../../../generated/BookManager/BookManager'
import { Book, Token } from '../../../generated/schema'
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
  fetchTokenTotalSupply,
} from '../../common/token'
import { ZERO_BD, ZERO_BI } from '../../common/constants'

const FEE_PRECISION = BigDecimal.fromString('1000000')
const RATE_MASK = BigInt.fromI32(8388607)
const MAX_FEE_RATE = BigInt.fromI32(500000)

// @ts-ignore
function getFeeRate(feePolicy: i32): BigDecimal {
  const feeBigInt = BigInt.fromI32(feePolicy)
    .bitAnd(RATE_MASK)
    .minus(MAX_FEE_RATE)
  return BigDecimal.fromString(feeBigInt.toString()).div(FEE_PRECISION)
}

export function handleOpen(event: Open): void {
  const book = new Book(event.params.id.toString()) as Book
  let quote = Token.load(event.params.quote)
  let base = Token.load(event.params.base)

  if (quote === null) {
    quote = new Token(event.params.quote)
    quote.symbol = fetchTokenSymbol(event.params.quote)
    quote.name = fetchTokenName(event.params.quote)
    quote.totalSupply = fetchTokenTotalSupply(event.params.quote)
    const decimals = fetchTokenDecimals(event.params.quote)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    quote.decimals = decimals
    quote.volume = ZERO_BD
    quote.volumeUSD = ZERO_BD
    quote.protocolFees = ZERO_BD
    quote.protocolFeesUSD = ZERO_BD
    quote.txCount = ZERO_BI
    quote.bookCount = ZERO_BI
    quote.totalValueLocked = ZERO_BD
    quote.totalValueLockedUSD = ZERO_BD
    quote.save()
  }

  if (base === null) {
    base = new Token(event.params.base)
    base.symbol = fetchTokenSymbol(event.params.base)
    base.name = fetchTokenName(event.params.base)
    base.totalSupply = fetchTokenTotalSupply(event.params.base)
    const decimals = fetchTokenDecimals(event.params.base)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    base.decimals = decimals
    base.volume = ZERO_BD
    base.volumeUSD = ZERO_BD
    base.protocolFees = ZERO_BD
    base.protocolFeesUSD = ZERO_BD
    base.txCount = ZERO_BI
    base.bookCount = ZERO_BI
    base.totalValueLocked = ZERO_BD
    base.totalValueLockedUSD = ZERO_BD
    base.save()
  }

  book.createdAtTimestamp = event.block.timestamp
  book.createdAtBlockNumber = event.block.number
  book.quote = quote.id
  book.base = base.id
  book.unitSize = event.params.unitSize
  book.makerPolicy = BigInt.fromI32(event.params.makerPolicy)
  book.makerFee = getFeeRate(event.params.makerPolicy)
  book.isMakerFeeInQuote = book.makerPolicy.rightShift(23).gt(ZERO_BI)
  book.takerPolicy = BigInt.fromI32(event.params.takerPolicy)
  book.takerFee = getFeeRate(event.params.takerPolicy)
  book.isTakerFeeInQuote = book.takerPolicy.rightShift(23).gt(ZERO_BI)
  book.hooks = event.params.hooks

  book.priceRaw = ZERO_BI
  book.price = ZERO_BD
  book.inversePrice = ZERO_BD
  book.tick = ZERO_BI
  book.volumeQuote = ZERO_BD
  book.volumeBase = ZERO_BD
  book.volumeUSD = ZERO_BD
  book.txCount = ZERO_BI
  book.protocolFeesQuote = ZERO_BD
  book.protocolFeesBase = ZERO_BD
  book.protocolFeesUSD = ZERO_BD
  book.totalValueLocked = ZERO_BD
  book.totalValueLockedUSD = ZERO_BD
  book.save()
}
