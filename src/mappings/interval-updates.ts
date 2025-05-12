import { Address, BigDecimal, ethereum } from '@graphprotocol/graph-ts'

import {
  Book,
  BookDayData,
  CloberDayData,
  Pool,
  PoolDayData,
  PoolHourData,
  Token,
  TokenDayData,
  Transaction,
  TransactionTypeDayData,
  User,
  UserDayData,
} from '../../generated/schema'
import { ONE_BI, ZERO_BD, ZERO_BI } from '../common/constants'
import {
  getOrCreateTransaction,
  getOrCreateUser,
} from '../common/entity-getters'

/**
 * Tracks global aggregate data over daily windows
 * @param event
 */
export function updateDayData(event: ethereum.Event): CloberDayData {
  const timestamp = event.block.timestamp.toI32()
  const dayID = timestamp / 86400 // rounded
  const dayStartTimestamp = dayID * 86400
  let cloberDayData = CloberDayData.load(dayID.toString())
  if (cloberDayData === null) {
    cloberDayData = new CloberDayData(dayID.toString())
    cloberDayData.date = dayStartTimestamp
    cloberDayData.txCount = ZERO_BI
    cloberDayData.walletCount = ZERO_BI
    cloberDayData.newWalletCount = ZERO_BI
  }

  const userDayDataId = event.transaction.from
    .toHexString()
    .concat('-')
    .concat(dayID.toString())
  let userDayData = UserDayData.load(userDayDataId)
  if (userDayData === null) {
    userDayData = new UserDayData(userDayDataId)
    userDayData.date = dayStartTimestamp
    userDayData.user = event.transaction.from
    userDayData.txCount = ZERO_BI

    cloberDayData.walletCount = cloberDayData.walletCount.plus(ONE_BI)
  }

  const functionSignature = event.transaction.input.toHexString().slice(0, 10)
  const txDayID = functionSignature.concat('-').concat(dayID.toString())
  let txTypeDayData = TransactionTypeDayData.load(txDayID)
  if (txTypeDayData === null) {
    txTypeDayData = new TransactionTypeDayData(txDayID)
    txTypeDayData.date = dayStartTimestamp
    txTypeDayData.cloberDayData = cloberDayData.id
    txTypeDayData.type = functionSignature
    txTypeDayData.txCount = ZERO_BI
  }

  if (User.load(event.transaction.from) === null) {
    cloberDayData.newWalletCount = cloberDayData.newWalletCount.plus(ONE_BI)

    getOrCreateUser(event)
  }

  if (Transaction.load(event.transaction.hash.toHexString()) === null) {
    cloberDayData.txCount = cloberDayData.txCount.plus(ONE_BI)
    txTypeDayData.txCount = txTypeDayData.txCount.plus(ONE_BI)

    getOrCreateTransaction(event)
  }

  cloberDayData.save()
  userDayData.save()
  txTypeDayData.save()
  return cloberDayData as CloberDayData
}

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
    tokenDayData.cloberDayData = dayID.toString()
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
