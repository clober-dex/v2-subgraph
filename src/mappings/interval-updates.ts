import { Address, BigDecimal, ethereum } from '@graphprotocol/graph-ts'

import {
  Book,
  BookDayData,
  PoolDayData,
  PoolHourData,
  Token,
  TokenDayData,
} from '../../generated/schema'
import { ONE_BI, ZERO_BI } from '../common/constants'

export function updateBookDayData(
  book: Book,
  event: ethereum.Event,
): BookDayData {
  const timestamp = event.block.timestamp.toI32()
  const dayID = timestamp / 86400
  const dayStartTimestamp = dayID * 86400
  const dayBookID = book.id.toString().concat('-').concat(dayID.toString())
  let bookDayData = BookDayData.load(dayBookID)
  if (bookDayData === null) {
    bookDayData = new BookDayData(dayBookID)
    bookDayData.date = dayStartTimestamp
    bookDayData.book = book.id
    bookDayData.txCount = ZERO_BI
  }

  bookDayData.price = book.price
  bookDayData.inversePrice = book.inversePrice
  bookDayData.txCount = bookDayData.txCount.plus(ONE_BI)
  bookDayData.protocolFeesQuote = book.protocolFeesQuote
  bookDayData.protocolFeesBase = book.protocolFeesBase
  bookDayData.protocolFeesUSD = book.protocolFeesUSD
  bookDayData.totalValueLocked = book.totalValueLocked
  bookDayData.totalValueLockedUSD = book.totalValueLockedUSD
  bookDayData.save()

  return bookDayData as BookDayData
}

export function updateTokenDayData(
  token: Token,
  tokenPrice: BigDecimal,
  event: ethereum.Event,
): TokenDayData {
  const timestamp = event.block.timestamp.toI32()
  const dayID = timestamp / 86400
  const dayStartTimestamp = dayID * 86400
  const tokenDayID = Address.fromBytes(token.id)
    .toHexString()
    .concat('-')
    .concat(dayID.toString())

  let tokenDayData = TokenDayData.load(tokenDayID)
  if (tokenDayData === null) {
    tokenDayData = new TokenDayData(tokenDayID)
    tokenDayData.date = dayStartTimestamp
    tokenDayData.token = token.id
  }

  tokenDayData.totalValueLocked = token.totalValueLocked
  tokenDayData.totalValueLockedUSD = token.totalValueLockedUSD
  tokenDayData.priceUSD = tokenPrice
  tokenDayData.protocolFees = token.protocolFees
  tokenDayData.protocolFeesUSD = token.protocolFeesUSD
  tokenDayData.save()

  return tokenDayData as TokenDayData
}

export function updatePoolDayData(event: ethereum.Event): PoolDayData {}

export function updatePoolHourData(event: ethereum.Event): PoolHourData {}
