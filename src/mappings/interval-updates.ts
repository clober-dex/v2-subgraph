import { Address, BigDecimal, ethereum } from '@graphprotocol/graph-ts'

import {
  Book,
  BookDayData,
  Pool,
  PoolDayData,
  PoolHourData,
  Token,
  TokenDayData,
} from '../../generated/schema'
import { ZERO_BD } from '../common/constants'

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
    // things that dont get initialized always
    bookDayData.volumeQuote = ZERO_BD
    bookDayData.volumeBase = ZERO_BD
    bookDayData.volumeUSD = ZERO_BD
    bookDayData.protocolFeesQuote = ZERO_BD
    bookDayData.protocolFeesBase = ZERO_BD
    bookDayData.protocolFeesUSD = ZERO_BD
  }

  bookDayData.price = book.price
  bookDayData.inversePrice = book.inversePrice
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
    // things that dont get initialized always
    tokenDayData.volume = ZERO_BD
    tokenDayData.volumeUSD = ZERO_BD
    tokenDayData.protocolFees = ZERO_BD
    tokenDayData.protocolFeesUSD = ZERO_BD
  }

  tokenDayData.totalValueLocked = token.totalValueLocked
  tokenDayData.totalValueLockedUSD = token.totalValueLockedUSD
  tokenDayData.priceUSD = tokenPrice
  tokenDayData.save()

  return tokenDayData as TokenDayData
}

export function updatePoolDayData(
  pool: Pool,
  event: ethereum.Event,
): PoolDayData {
  const timestamp = event.block.timestamp.toI32()
  const dayID = timestamp / 86400
  const dayStartTimestamp = dayID * 86400
  const tokenDayID = pool.id.toHexString().concat('-').concat(dayID.toString())

  let poolDayData = PoolDayData.load(tokenDayID)
  if (poolDayData === null) {
    poolDayData = new PoolDayData(tokenDayID)
    poolDayData.date = dayStartTimestamp
    poolDayData.pool = pool.id
    // things that dont get initialized always
    poolDayData.volumeTokenA = ZERO_BD
    poolDayData.volumeTokenB = ZERO_BD
    poolDayData.volumeUSD = ZERO_BD
    poolDayData.spreadProfitUSD = ZERO_BD
  }
  poolDayData.oraclePrice = pool.oraclePrice
  poolDayData.totalSupply = pool.totalSupply
  poolDayData.liquidityA = pool.liquidityA
  poolDayData.liquidityB = pool.liquidityB
  poolDayData.lpPriceUSD = pool.lpPriceUSD
  poolDayData.priceA = pool.priceA
  poolDayData.priceARaw = pool.priceARaw
  poolDayData.tickA = pool.tickA
  poolDayData.priceB = pool.priceB
  poolDayData.priceBRaw = pool.priceBRaw
  poolDayData.tickB = pool.tickB
  poolDayData.save()

  return poolDayData as PoolDayData
}

export function updatePoolHourData(
  pool: Pool,
  event: ethereum.Event,
): PoolHourData {
  const timestamp = event.block.timestamp.toI32()
  const hourIndex = timestamp / 3600 // get unique hour within unix history
  const hourStartUnix = hourIndex * 3600 // want the rounded effect
  const tokenHourID = pool.id
    .toHexString()
    .concat('-')
    .concat(hourIndex.toString())

  let poolHourData = PoolHourData.load(tokenHourID)
  if (poolHourData === null) {
    poolHourData = new PoolHourData(tokenHourID)
    poolHourData.date = hourStartUnix
    poolHourData.pool = pool.id
    // things that dont get initialized always
    poolHourData.volumeTokenA = ZERO_BD
    poolHourData.volumeTokenB = ZERO_BD
    poolHourData.volumeUSD = ZERO_BD
    poolHourData.spreadProfitUSD = ZERO_BD
  }
  poolHourData.oraclePrice = pool.oraclePrice
  poolHourData.totalSupply = pool.totalSupply
  poolHourData.liquidityA = pool.liquidityA
  poolHourData.liquidityB = pool.liquidityB
  poolHourData.lpPriceUSD = pool.lpPriceUSD
  poolHourData.priceA = pool.priceA
  poolHourData.priceARaw = pool.priceARaw
  poolHourData.tickA = pool.tickA
  poolHourData.priceB = pool.priceB
  poolHourData.priceBRaw = pool.priceBRaw
  poolHourData.tickB = pool.tickB
  poolHourData.save()

  return poolHourData as PoolHourData
}
