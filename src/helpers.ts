import { Address, BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts'

import { ERC20 } from '../generated/BookManager/ERC20'
import { ERC20SymbolBytes } from '../generated/BookManager/ERC20SymbolBytes'
import { ERC20NameBytes } from '../generated/BookManager/ERC20NameBytes'
import {
  Book,
  BookTransactionSnapshot,
  LatestPoolSpread,
  PoolSpreadProfit,
  Snapshot,
  Token,
  TransactionSnapshot,
  VolumeSnapshot,
  WalletSnapshot,
  WalletVolumeSnapshot,
} from '../generated/schema'

import {
  ADDRESS_ZERO,
  CHART_LOG_INTERVALS,
  encodePoolSpreadProfitId,
  getChainId,
  getNativeTokenName,
  getNativeTokenSymbol,
  getUSDCAddress,
  getWETHAddress,
} from './utils'
import { normalizeDailyTimestamp } from './utils/math'

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
  if (token.equals(ADDRESS_ZERO) || token.equals(getWETHAddress())) {
    ethVolume = amount
  }
  let usdcVolume = BigInt.fromI32(0)
  if (token.equals(getUSDCAddress())) {
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
  let bookTransactionSnapshot = BookTransactionSnapshot.load(
    bookTransactionSnapshotKey,
  )
  if (bookTransactionSnapshot === null) {
    bookTransactionSnapshot = new BookTransactionSnapshot(
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
      bookTransactionSnapshot.makeTransactionCount =
        bookTransactionSnapshot.makeTransactionCount.plus(BigInt.fromI32(1))
    } else {
      bookTransactionSnapshot.takeTransactionCount =
        bookTransactionSnapshot.takeTransactionCount.plus(BigInt.fromI32(1))
    }
    bookTransactionSnapshot.save()
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

export function fetchTokenSymbol(
  tokenAddress: Address,
  chainId: BigInt,
): string {
  if (tokenAddress.equals(ADDRESS_ZERO)) {
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
      if (!isNullValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function fetchTokenName(tokenAddress: Address, chainId: BigInt): string {
  if (tokenAddress.equals(ADDRESS_ZERO)) {
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
      if (!isNullValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  if (tokenAddress.equals(ADDRESS_ZERO)) {
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

  const poolSpreadProfitId = encodePoolSpreadProfitId(
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

function isNullValue(value: string): boolean {
  return (
    value ==
    '0x0000000000000000000000000000000000000000000000000000000000000001'
  )
}
