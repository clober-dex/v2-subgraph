import {
  Address,
  BigDecimal,
  Bytes,
  ethereum,
  BigInt,
} from '@graphprotocol/graph-ts'

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
  UserDayVolume,
} from '../../generated/schema'
import {
  ADDRESS_ZERO,
  BI_18,
  ONE_BI,
  ZERO_BD,
  ZERO_BI,
} from '../common/constants'
import {
  getOrCreateTransaction,
  getOrCreateUser,
} from '../common/entity-getters'
import {
  REFERENCE_TOKEN,
  SKIP_USER_ANALYTICS,
  SKIP_TX_ANALYTICS,
} from '../common/chain'
import { convertTokenToDecimal } from '../common/utils'

/**
 * Tracks global aggregate data over daily windows
 * @param event
 */
export function updateDayData(event: ethereum.Event): void {
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

  const user = event.transaction.from.toHexString()
  const userDayDataId = user.concat('-').concat(dayID.toString())
  let userDayData = UserDayData.load(userDayDataId)
  if (userDayData === null) {
    userDayData = new UserDayData(userDayDataId)
    userDayData.date = dayStartTimestamp
    userDayData.user = Address.fromString(user)
    userDayData.txCount = ZERO_BI

    // increment the wallet count on the clober day data
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

  if (!SKIP_USER_ANALYTICS && User.load(Address.fromString(user)) === null) {
    cloberDayData.newWalletCount = cloberDayData.newWalletCount.plus(ONE_BI)

    getOrCreateUser(event)
  }

  if (
    !SKIP_TX_ANALYTICS &&
    Transaction.load(event.transaction.hash.toHexString()) === null
  ) {
    userDayData.txCount = userDayData.txCount.plus(ONE_BI)
    cloberDayData.txCount = cloberDayData.txCount.plus(ONE_BI)
    txTypeDayData.txCount = txTypeDayData.txCount.plus(ONE_BI)

    getOrCreateTransaction(event)
  }

  cloberDayData.save()
  if (!SKIP_USER_ANALYTICS) {
    userDayData.save()
  }
  if (!SKIP_TX_ANALYTICS) {
    txTypeDayData.save()
  }
}

export function updateUserNativeVolume(
  event: ethereum.Event,
  inputToken: Bytes,
  outputToken: Bytes,
  inputAmount: BigInt,
  outputAmount: BigInt,
): void {
  if (SKIP_USER_ANALYTICS) {
    return
  }
  const isInputNative = inputToken.toHexString() == ADDRESS_ZERO
  const isOutputNative = outputToken.toHexString() == ADDRESS_ZERO
  const isInputReference = inputToken.toHexString() == REFERENCE_TOKEN
  const isOutputReference = outputToken.toHexString() == REFERENCE_TOKEN
  const isWrapOrUnwrap =
    (isInputNative && isOutputReference) || (isOutputNative && isInputReference)
  const isNativeTx = isInputNative || isOutputNative

  if (!isNativeTx || isWrapOrUnwrap) {
    return
  }
  const nativeAmount = isInputNative
    ? convertTokenToDecimal(inputAmount, BI_18)
    : convertTokenToDecimal(outputAmount, BI_18)
  const user = getOrCreateUser(event)
  user.nativeVolume = user.nativeVolume.plus(nativeAmount)
  user.save()
}

export function updateUserDayVolume(
  token: Token,
  event: ethereum.Event,
  volume: BigDecimal,
  volumeUSD: BigDecimal,
): void {
  if (SKIP_USER_ANALYTICS) {
    return
  }
  const timestamp = event.block.timestamp.toI32()
  const dayID = timestamp / 86400 // rounded
  const dayStartTimestamp = dayID * 86400
  const user = event.transaction.from.toHexString()
  const userDayDataId = user.concat('-').concat(dayID.toString())
  const userDayVolumeID = user
    .concat('-')
    .concat(token.id.toHexString())
    .concat('-')
    .concat(dayID.toString())
  let userDayVolume = UserDayVolume.load(userDayVolumeID)
  if (userDayVolume === null) {
    userDayVolume = new UserDayVolume(userDayVolumeID)
    userDayVolume.date = dayStartTimestamp
    userDayVolume.user = Address.fromString(user)
    userDayVolume.userDayData = userDayDataId
    userDayVolume.token = token.id
    userDayVolume.volume = ZERO_BD
    userDayVolume.volumeUSD = ZERO_BD
  }
  userDayVolume.volume = userDayVolume.volume.plus(volume)
  userDayVolume.volumeUSD = userDayVolume.volumeUSD.plus(volumeUSD)
  userDayVolume.save()
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
    bookDayData.open = book.price
    bookDayData.high = book.price
    bookDayData.low = book.price
    bookDayData.close = book.price
  }

  if (book.price.gt(bookDayData.high)) {
    bookDayData.high = book.price
  }
  if (book.price.lt(bookDayData.low)) {
    bookDayData.low = book.price
  }

  bookDayData.price = book.price
  bookDayData.close = book.price
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
    tokenDayData.open = tokenPrice
    tokenDayData.high = tokenPrice
    tokenDayData.low = tokenPrice
    tokenDayData.close = tokenPrice
  }

  if (tokenPrice.gt(tokenDayData.high)) {
    tokenDayData.high = tokenPrice
  }

  if (tokenPrice.lt(tokenDayData.low)) {
    tokenDayData.low = tokenPrice
  }

  tokenDayData.totalValueLocked = token.totalValueLocked
  tokenDayData.totalValueLockedUSD = token.totalValueLockedUSD
  tokenDayData.priceUSD = tokenPrice
  tokenDayData.close = tokenPrice
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
    poolDayData.protocolFeesTokenA = ZERO_BD
    poolDayData.protocolFeesTokenB = ZERO_BD
    poolDayData.protocolFeesAUSD = ZERO_BD
    poolDayData.protocolFeesBUSD = ZERO_BD
    poolDayData.totalValueLockedUSD = ZERO_BD
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
  poolDayData.totalValueLockedUSD = pool.totalValueLockedUSD
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
    poolHourData.protocolFeesTokenA = ZERO_BD
    poolHourData.protocolFeesTokenB = ZERO_BD
    poolHourData.protocolFeesAUSD = ZERO_BD
    poolHourData.protocolFeesBUSD = ZERO_BD
    poolHourData.totalValueLockedUSD = ZERO_BD
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
  poolHourData.totalValueLockedUSD = pool.totalValueLockedUSD
  poolHourData.save()

  return poolHourData as PoolHourData
}
