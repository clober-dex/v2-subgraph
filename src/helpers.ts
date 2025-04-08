import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  TypedMap,
} from '@graphprotocol/graph-ts'

import { ERC20 } from '../generated/BookManager/ERC20'
import { ERC20SymbolBytes } from '../generated/BookManager/ERC20SymbolBytes'
import { ERC20NameBytes } from '../generated/BookManager/ERC20NameBytes'
import {
  Book,
  BookTransactionSnapshot,
  LatestPoolSpread,
  OpenOrder,
  PoolSpreadProfit,
  Snapshot,
  Token,
  TokenBalance,
  TokenHolder,
  TransactionSnapshot,
  VolumeSnapshot,
  WalletSnapshot,
  WalletVolumeSnapshot,
} from '../generated/schema'
import {
  Hatchhog,
  Hatchhog__tokenInfoResultValue0Struct,
} from '../generated/Hatchhog/Hatchhog'

import {
  BERA_TESTNET,
  getChainId,
  getUSDCAddress,
  getWETHAddress,
  MITOSIS_TESTNET,
  SONIC_MAINNET,
} from './addresses'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export const CHART_LOG_INTERVALS = new TypedMap<string, number>()
CHART_LOG_INTERVALS.set('1m', 60)
CHART_LOG_INTERVALS.set('3m', 3 * 60)
CHART_LOG_INTERVALS.set('5m', 5 * 60)
CHART_LOG_INTERVALS.set('10m', 10 * 60)
CHART_LOG_INTERVALS.set('15m', 15 * 60)
CHART_LOG_INTERVALS.set('30m', 30 * 60)
CHART_LOG_INTERVALS.set('1h', 60 * 60)
CHART_LOG_INTERVALS.set('2h', 2 * 60 * 60)
CHART_LOG_INTERVALS.set('4h', 4 * 60 * 60)
CHART_LOG_INTERVALS.set('6h', 6 * 60 * 60)
CHART_LOG_INTERVALS.set('1d', 24 * 60 * 60)
CHART_LOG_INTERVALS.set('1w', 7 * 24 * 60 * 60)

export const pricePrecision = BigInt.fromI32(2).pow(96)

export function normalizeDailyTimestamp(timestamp: BigInt): BigInt {
  return timestamp.minus(timestamp.mod(BigInt.fromI32(86400)))
}

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

export function buildDepthId(bookId: string, tick: BigInt): string {
  return bookId.concat('-').concat(tick.toString())
}

export function buildChartLogId(
  base: Token,
  quote: Token,
  intervalType: string,
  timestamp: i64,
): string {
  const marketCode = buildMarketCode(base, quote)
  return marketCode
    .concat('-')
    .concat(intervalType)
    .concat('-')
    .concat(timestamp.toString())
}

export function buildPoolVolumeAndSnapshotId(
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

export function buildPoolSpreadProfitId(
  intervalType: string,
  timestamp: i64,
): string {
  return intervalType.concat('-').concat(timestamp.toString())
}

export function buildTokenBalanceId(holder: Address, token: Token): string {
  return holder.toHexString().concat('-').concat(token.id)
}

export function buildMarketCode(base: Token, quote: Token): string {
  return base.id.concat('/').concat(quote.id)
}

function getNativeTokenSymbol(chainId: BigInt): string {
  if (chainId == BERA_TESTNET) {
    return 'BERA'
  } else if (chainId == MITOSIS_TESTNET) {
    return 'MITO'
  } else if (chainId == SONIC_MAINNET) {
    return 'S'
  } else {
    return 'ETH'
  }
}

function getNativeTokenName(chainId: BigInt): string {
  if (chainId == BERA_TESTNET) {
    return 'BERA Token'
  } else if (chainId == MITOSIS_TESTNET) {
    return 'MITO Token'
  } else if (chainId == SONIC_MAINNET) {
    return 'S Token'
  } else {
    return 'Ether'
  }
}

export function getOrCreateSnapshot(timestamp: BigInt): Snapshot {
  const dailyNormalizedTimestamp = normalizeDailyTimestamp(timestamp)
  let snapshot = Snapshot.load(dailyNormalizedTimestamp.toString())
  if (snapshot === null) {
    snapshot = new Snapshot(dailyNormalizedTimestamp.toString())
    snapshot.transactionCount = BigInt.fromI32(0)
    snapshot.walletCount = BigInt.fromI32(0)
    snapshot.volumeSnapshots = []
  }
  snapshot.save()
  return snapshot
}

export function getOrCreateVolumeSnapshot(
  timestamp: BigInt,
  tokenAddress: Address,
): VolumeSnapshot {
  const dailyNormalizedTimestamp = normalizeDailyTimestamp(timestamp)
  const key = dailyNormalizedTimestamp
    .toString()
    .concat('-')
    .concat(tokenAddress.toHexString())
  let volumeSnapshot = VolumeSnapshot.load(key)
  const token = Token.load(tokenAddress.toHexString())
  if (token === null) {
    throw new Error('Token not found')
  }
  if (volumeSnapshot === null) {
    volumeSnapshot = new VolumeSnapshot(key)
    volumeSnapshot.timestamp = dailyNormalizedTimestamp
    volumeSnapshot.token = token.id
    volumeSnapshot.amount = BigInt.fromI32(0)
  }
  volumeSnapshot.save()
  return volumeSnapshot
}

export function updateWalletVolumeSnapshot(
  timestamp: BigInt,
  wallet: Address,
  token: Address,
  amount: BigInt,
): void {
  const dailyNormalizedTimestamp = normalizeDailyTimestamp(timestamp)
  const key = dailyNormalizedTimestamp
    .toString()
    .concat('-')
    .concat(wallet.toHexString())
  let swalletVolumeSnapshot = WalletVolumeSnapshot.load(key)
  let ethVolume = BigInt.fromI32(0)
  if (
    token.toHexString() == ADDRESS_ZERO ||
    token.toHexString() == getWETHAddress()
  ) {
    ethVolume = amount
  }
  let usdcVolume = BigInt.fromI32(0)
  if (token.toHexString() == getUSDCAddress()) {
    usdcVolume = amount
  }

  if (ethVolume.isZero() && usdcVolume.isZero()) {
    return
  }

  if (swalletVolumeSnapshot === null) {
    swalletVolumeSnapshot = new WalletVolumeSnapshot(key)
    swalletVolumeSnapshot.wallet = wallet.toHexString()
    swalletVolumeSnapshot.timestamp = dailyNormalizedTimestamp
    swalletVolumeSnapshot.ethVolume = BigInt.fromI32(0)
    swalletVolumeSnapshot.usdcVolume = BigInt.fromI32(0)
  }
  swalletVolumeSnapshot.ethVolume =
    swalletVolumeSnapshot.ethVolume.plus(ethVolume)
  swalletVolumeSnapshot.usdcVolume =
    swalletVolumeSnapshot.usdcVolume.plus(usdcVolume)
  swalletVolumeSnapshot.save()
}

export function updateWalletsInSnapshot(
  snapshot: Snapshot,
  wallet: Address,
): void {
  const key = snapshot.id.concat('-').concat(wallet.toHexString())
  let walletSnapshot = WalletSnapshot.load(key)
  if (walletSnapshot === null) {
    walletSnapshot = new WalletSnapshot(key)
    walletSnapshot.wallet = wallet.toHexString()
    walletSnapshot.timestamp = BigInt.fromString(snapshot.id)
    walletSnapshot.save()
    snapshot.walletCount = snapshot.walletCount.plus(BigInt.fromI32(1))
  }
  snapshot.save()
}

export function updateBookTransactionsAndTransactionsInSnapshot(
  snapshot: Snapshot,
  transactionHash: Bytes,
  book: Book,
  isMaker: boolean,
): void {
  const bookTransactionSnapshotKey = snapshot.id.concat('-').concat(book.id)
  const bookTransactionSnapshot = BookTransactionSnapshot.load(
    bookTransactionSnapshotKey,
  )
  if (bookTransactionSnapshot === null) {
    const bookTransactionSnapshot = new BookTransactionSnapshot(
      bookTransactionSnapshotKey,
    )
    bookTransactionSnapshot.book = book.id
    bookTransactionSnapshot.timestamp = BigInt.fromString(snapshot.id)
    bookTransactionSnapshot.makeTransactionCount = BigInt.fromI32(0)
    bookTransactionSnapshot.takeTransactionCount = BigInt.fromI32(0)
    bookTransactionSnapshot.save()
  }

  const transactionSnapshotKey = snapshot.id
    .concat('-')
    .concat(transactionHash.toHexString())
  let transactionSnapshot = TransactionSnapshot.load(transactionSnapshotKey)
  if (transactionSnapshot === null) {
    transactionSnapshot = new TransactionSnapshot(transactionSnapshotKey)
    transactionSnapshot.txHash = transactionHash.toHexString()
    transactionSnapshot.timestamp = BigInt.fromString(snapshot.id)
    transactionSnapshot.save()
    snapshot.transactionCount = snapshot.transactionCount.plus(
      BigInt.fromI32(1),
    )

    if (isMaker) {
      bookTransactionSnapshot!.makeTransactionCount =
        bookTransactionSnapshot!.makeTransactionCount.plus(BigInt.fromI32(1))
    } else {
      bookTransactionSnapshot!.takeTransactionCount =
        bookTransactionSnapshot!.takeTransactionCount.plus(BigInt.fromI32(1))
    }
    bookTransactionSnapshot!.save()
  }
  snapshot.save()
}

export function updateTransactionsInSnapshot(
  snapshot: Snapshot,
  transactionHash: Bytes,
): void {
  const key = snapshot.id.concat('-').concat(transactionHash.toHexString())
  let transactionSnapshot = TransactionSnapshot.load(key)
  if (transactionSnapshot === null) {
    transactionSnapshot = new TransactionSnapshot(key)
    transactionSnapshot.txHash = transactionHash.toHexString()
    transactionSnapshot.timestamp = BigInt.fromString(snapshot.id)
    transactionSnapshot.save()
    snapshot.transactionCount = snapshot.transactionCount.plus(
      BigInt.fromI32(1),
    )
  }
  snapshot.save()
}

export function createToken(tokenAddress: Address): Token {
  const chainId = getChainId()
  let token = Token.load(tokenAddress.toHexString())
  if (token === null) {
    token = new Token(tokenAddress.toHexString())
    token.symbol = fetchTokenSymbol(tokenAddress, chainId)
    token.name = fetchTokenName(tokenAddress, chainId)
    token.decimals = fetchTokenDecimals(tokenAddress)
  }
  token.save()
  return token
}

export function createTokenBalance(token: Token, user: Address): TokenBalance {
  const id = buildTokenBalanceId(user, token)
  let holder = TokenHolder.load(user.toHexString())
  if (holder == null) {
    holder = new TokenHolder(user.toHexString())
    holder.save()
  }
  let balance = TokenBalance.load(id)
  if (balance === null) {
    balance = new TokenBalance(id)
    balance.token = token.id
    balance.user = holder.id
    balance.amount = BigInt.fromI32(0)
    balance.updatedAt = BigInt.fromI32(0)
  }
  balance.save()
  return balance
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

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    '0x0000000000000000000000000000000000000000000000000000000000000001'
  )
}

export function fetchTokenSymbol(
  tokenAddress: Address,
  chainId: BigInt,
): string {
  if (tokenAddress.toHexString() == ADDRESS_ZERO) {
    return getNativeTokenSymbol(chainId)
  }
  const contract = ERC20.bind(tokenAddress)
  const contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  const symbolResult = contract.try_symbol()
  if (symbolResult.reverted) {
    const symbolResultBytes = contractSymbolBytes.try_symbol()
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function fetchTokenName(tokenAddress: Address, chainId: BigInt): string {
  if (tokenAddress.toHexString() == ADDRESS_ZERO) {
    return getNativeTokenName(chainId)
  }
  const contract = ERC20.bind(tokenAddress)
  const contractNameBytes = ERC20NameBytes.bind(tokenAddress)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  const nameResult = contract.try_name()
  if (nameResult.reverted) {
    const nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  if (tokenAddress.toHexString() == ADDRESS_ZERO) {
    return BigInt.fromI32(18)
  }
  const contract = ERC20.bind(tokenAddress)
  // try types uint8 for decimals
  let decimalValue = 18
  const decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }
  return BigInt.fromI32(decimalValue as i32)
}

export function getLatestPoolSpread(): LatestPoolSpread {
  const id = 'latest'
  let latestPoolSpread = LatestPoolSpread.load(id)
  if (latestPoolSpread === null) {
    latestPoolSpread = new LatestPoolSpread(id)
    latestPoolSpread.askTick = BigInt.fromI32(0)
    latestPoolSpread.bidTick = BigInt.fromI32(0)
    latestPoolSpread.askPrice = BigDecimal.zero()
    latestPoolSpread.bidPrice = BigDecimal.zero()
  }
  return latestPoolSpread as LatestPoolSpread
}

export function getPoolSpreadProfit(timestamp: BigInt): PoolSpreadProfit {
  const intervalEntry = CHART_LOG_INTERVALS.getEntry('5m')! // only use 5m interval for now
  const intervalType = intervalEntry.key
  const intervalInNumber = intervalEntry.value
  const timestampForAcc = (Math.floor(
    (timestamp.toI64() as number) / intervalInNumber,
  ) * intervalInNumber) as i64

  const poolSpreadProfitId = buildPoolSpreadProfitId(
    intervalType,
    timestampForAcc,
  )

  let poolSpreadProfit = PoolSpreadProfit.load(poolSpreadProfitId)
  if (poolSpreadProfit === null) {
    poolSpreadProfit = new PoolSpreadProfit(poolSpreadProfitId)
    poolSpreadProfit.intervalType = intervalType
    poolSpreadProfit.timestamp = BigInt.fromI64(timestampForAcc)
    poolSpreadProfit.accumulatedProfitInUsd = BigDecimal.zero()
  }
  return poolSpreadProfit as PoolSpreadProfit
}

export function bytesToBigIntBigEndian(bytes: Bytes): BigInt {
  let value = BigInt.fromI32(0)
  for (let i = 0; i < bytes.length; i++) {
    value = value.times(BigInt.fromI32(256)).plus(BigInt.fromI32(bytes[i]))
  }
  return value
}

export function fetchTokenInfo(
  hatchhog: Address,
  token: Address,
): Hatchhog__tokenInfoResultValue0Struct {
  const contract = Hatchhog.bind(hatchhog)
  const tokenInfo = contract.try_tokenInfo(token)
  if (tokenInfo.reverted) {
    throw new Error('Token reverted')
  }
  return tokenInfo.value
}

export function fetchPoolAddress(hatchhog: Address, token: Address): Address {
  const contract = Hatchhog.bind(hatchhog)
  const poolAddress = contract.try_computePoolAddress(token)
  if (poolAddress.reverted) {
    throw new Error('Pool reverted')
  }
  return poolAddress.value
}

export function fetchPriorMilestones(
  hatchhog: Address,
  token: Address,
): BigInt[] {
  const contract = Hatchhog.bind(hatchhog)
  const milestones = contract.try_getPriorMilestones(token)
  if (milestones.reverted) {
    throw new Error('Millstones reverted')
  }
  return milestones.value
}

export function fetchSubsequentMilestones(
  hatchhog: Address,
  token: Address,
): BigInt[] {
  const contract = Hatchhog.bind(hatchhog)
  const milestones = contract.try_getSubsequentMilestones(token)
  if (milestones.reverted) {
    throw new Error('Millstones reverted')
  }
  return milestones.value
}
