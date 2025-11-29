import { BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts'

import {
  Book,
  Depth,
  OpenOrder,
  Pool,
  Token,
  Transaction,
  User,
  UserPoolBalance,
} from '../../generated/schema'

import { ZERO_BD } from './constants'

export function getOrCreateUserByFrom(event: ethereum.Event): User {
  let user = User.load(event.transaction.from)
  if (user === null) {
    user = new User(event.transaction.from)
    user.firstSeenTimestamp = event.block.timestamp
    user.firstSeenBlockNumber = event.block.number
    user.nativeVolume = ZERO_BD
  }
  user.save()
  return user as User
}

export function getOrCreateUser(userID: Bytes, block: ethereum.Block): User {
  let user = User.load(userID)
  if (user === null) {
    user = new User(userID)
    user.firstSeenTimestamp = block.timestamp
    user.firstSeenBlockNumber = block.number
    user.nativeVolume = ZERO_BD
  }
  user.save()
  return user as User
}

export function getOrCreateTransaction(event: ethereum.Event): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString())
  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString())
  }
  transaction.blockNumber = event.block.number
  transaction.timestamp = event.block.timestamp
  transaction.gasUsed = BigInt.zero() //needs to be moved to transaction receipt
  transaction.gasPrice = event.transaction.gasPrice
  transaction.from = event.transaction.from
  transaction.to = event.transaction.to
  transaction.value = event.transaction.value
  transaction.save()
  return transaction as Transaction
}

export function getTokenOrLog(tokenID: Bytes, eventType: string): Token | null {
  const token = Token.load(tokenID)
  if (token === null) {
    log.error('[{}] Token not found: {}', [eventType, tokenID.toHexString()])
  }
  return token
}

export function getBookOrLog(bookID: string, eventType: string): Book | null {
  const book = Book.load(bookID)
  if (book === null) {
    log.error('[{}] Book not found: {}', [eventType, bookID])
  }
  return book
}

export function getDepthOrLog(
  depthID: string,
  eventType: string,
): Depth | null {
  const depth = Depth.load(depthID)
  if (depth === null) {
    log.error('[{}] Depth not found: {}', [eventType, depthID])
  }
  return depth
}

export function getOpenOrderOrLog(
  openOrderID: string,
  eventType: string,
): OpenOrder | null {
  const openOrder = OpenOrder.load(openOrderID)
  if (openOrder === null) {
    log.error('[{}] Open order not found: {}', [eventType, openOrderID])
  }
  return openOrder
}

export function getPoolOrLog(poolID: Bytes, eventType: string): Pool | null {
  const pool = Pool.load(poolID)
  if (pool === null) {
    log.error('[{}] Pool not found: {}', [eventType, poolID.toHexString()])
  }
  return pool
}

export function getOrCreateUserPoolBalance(
  userID: Bytes,
  poolID: Bytes,
  event: ethereum.Event,
): UserPoolBalance {
  const key = userID.toHexString().concat('-').concat(poolID.toHexString())
  let userPoolBalance = UserPoolBalance.load(key)
  if (userPoolBalance === null) {
    userPoolBalance = new UserPoolBalance(key)
    userPoolBalance.user = getOrCreateUser(userID, event.block).id
    userPoolBalance.pool = poolID
    userPoolBalance.lpBalance = ZERO_BD
    userPoolBalance.lpBalanceUSD = ZERO_BD

    userPoolBalance.costBasisUSD = ZERO_BD
    userPoolBalance.averageLPPriceUSD = ZERO_BD
    userPoolBalance.pnlUSD = ZERO_BD

    userPoolBalance.save()
  }
  return userPoolBalance
}
