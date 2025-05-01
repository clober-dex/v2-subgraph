import { BigInt, log } from '@graphprotocol/graph-ts'

import { Burn, Claim, Mint, Open } from '../../generated/Rebalancer/Rebalancer'
import { UpdatePosition } from '../../generated/SimpleOracleStrategy/SimpleOracleStrategy'
import { Book, Pool, PoolSnapshot, PoolVolume } from '../../generated/schema'
import {
  baseToQuote,
  CHART_LOG_INTERVALS,
  encodePoolVolumeAndSnapshotId,
  tickToPrice,
} from '../utils'

export function handlePoolOpen(event: Open): void {
  const pool = new Pool(event.params.key.toHexString())
  const bookA = Book.load(event.params.bookIdA.toHexString())
  if (bookA != null) {
    bookA.pool = pool.id
    bookA.save()
  } else {
    log.error('BookA not found for pool: {}', [
      event.params.bookIdA.toHexString(),
    ])
    return
  }
  const bookB = Book.load(event.params.bookIdB.toHexString())
  if (bookB != null) {
    bookB.pool = pool.id
    bookB.save()
  } else {
    log.error('BookB not found for pool: {}', [
      event.params.bookIdB.toHexString(),
    ])
    return
  }
  pool.salt = event.params.salt.toHexString()
  pool.strategy = event.params.strategy.toHexString()
  pool.tokenA = bookA.quote
  pool.tokenB = bookB.quote
  pool.liquidityA = BigInt.zero()
  pool.liquidityB = BigInt.zero()
  pool.totalSupply = BigInt.zero()
  pool.tickA = BigInt.zero()
  pool.tickB = BigInt.zero()
  pool.save()
}

export function handleMint(event: Mint): void {
  const pool = Pool.load(event.params.key.toHexString())
  if (pool === null) {
    log.error('Pool not found for mint event: {}', [
      event.params.key.toHexString(),
    ])
    return
  }
  pool.totalSupply = pool.totalSupply.plus(event.params.lpAmount)
  pool.liquidityA = pool.liquidityA.plus(event.params.amountA)
  pool.liquidityB = pool.liquidityB.plus(event.params.amountB)
  pool.save()
}

export function handleBurn(event: Burn): void {
  const pool = Pool.load(event.params.key.toHexString())
  if (pool === null) {
    log.error('Pool not found for burn event: {}', [
      event.params.key.toHexString(),
    ])
    return
  }
  pool.totalSupply = pool.totalSupply.minus(event.params.lpAmount)
  pool.liquidityA = pool.liquidityA.minus(event.params.amountA)
  pool.liquidityB = pool.liquidityB.minus(event.params.amountB)
  pool.save()
}

export function handleRebalancerClaim(event: Claim): void {
  const poolKey = event.params.key
  const pool = Pool.load(poolKey.toHexString())
  if (pool === null) {
    log.error('Pool not found for claim event: {}', [poolKey.toHexString()])
    return
  }
  const currencyAClaimedAmount = event.params.claimedAmountA
  const currencyBClaimedAmount = event.params.claimedAmountB
  const bookAPrice = tickToPrice(pool.tickA.toI32())
  const bookBPrice = tickToPrice(pool.tickB.toI32())

  const bookACurrencyAVolume = baseToQuote(currencyBClaimedAmount, bookAPrice)
  const bookACurrencyBVolume = currencyBClaimedAmount
  const bookBCurrencyAVolume = currencyAClaimedAmount
  const bookBCurrencyBVolume = baseToQuote(currencyAClaimedAmount, bookBPrice)
  const totalCurrencyAVolume = bookACurrencyAVolume.plus(bookBCurrencyAVolume)
  const totalCurrencyBVolume = bookACurrencyBVolume.plus(bookBCurrencyBVolume)

  const intervalEntry = CHART_LOG_INTERVALS.getEntry('5m')! // only use 5m interval for now
  const intervalType = intervalEntry.key
  const intervalInNumber = intervalEntry.value
  const timestampForAcc = (Math.floor(
    (event.block.timestamp.toI64() as number) / intervalInNumber,
  ) * intervalInNumber) as i64

  const poolVolumeId = encodePoolVolumeAndSnapshotId(
    poolKey,
    intervalType,
    timestampForAcc,
  )
  let poolVolume = PoolVolume.load(poolVolumeId)
  if (poolVolume === null) {
    poolVolume = new PoolVolume(poolVolumeId)
    poolVolume.poolKey = poolKey.toHexString()
    poolVolume.intervalType = intervalType
    poolVolume.timestamp = BigInt.fromI64(timestampForAcc)
    poolVolume.currencyAVolume = BigInt.zero()
    poolVolume.currencyBVolume = BigInt.zero()
    poolVolume.bookACurrencyAVolume = BigInt.zero()
    poolVolume.bookACurrencyBVolume = BigInt.zero()
    poolVolume.bookBCurrencyAVolume = BigInt.zero()
    poolVolume.bookBCurrencyBVolume = BigInt.zero()
  }

  poolVolume.currencyAVolume =
    poolVolume.currencyAVolume.plus(totalCurrencyAVolume)
  poolVolume.currencyBVolume =
    poolVolume.currencyBVolume.plus(totalCurrencyBVolume)
  poolVolume.bookACurrencyAVolume =
    poolVolume.bookACurrencyAVolume.plus(bookACurrencyAVolume)
  poolVolume.bookACurrencyBVolume =
    poolVolume.bookACurrencyBVolume.plus(bookACurrencyBVolume)
  poolVolume.bookBCurrencyAVolume =
    poolVolume.bookBCurrencyAVolume.plus(bookBCurrencyAVolume)
  poolVolume.bookBCurrencyBVolume =
    poolVolume.bookBCurrencyBVolume.plus(bookBCurrencyBVolume)

  poolVolume.save()
}

export function handleUpdatePosition(event: UpdatePosition): void {
  const poolKey = event.params.key
  const pool = Pool.load(poolKey.toHexString())
  if (pool === null) {
    log.error('Pool not found for update position event: {}', [
      poolKey.toHexString(),
    ])
    return
  }
  pool.tickA = BigInt.fromI32(event.params.tickA)
  pool.tickB = BigInt.fromI32(event.params.tickB)
  pool.save()

  const totalLiquidityA = pool.liquidityA
  const totalLiquidityB = pool.liquidityB
  const totalSupply = pool.totalSupply

  for (let i = 0; i < CHART_LOG_INTERVALS.entries.length; i++) {
    const intervalEntry = CHART_LOG_INTERVALS.entries[i]
    const intervalType = intervalEntry.key
    const intervalInNumber = intervalEntry.value
    const timestampForAcc = (Math.floor(
      (event.block.timestamp.toI64() as number) / intervalInNumber,
    ) * intervalInNumber) as i64

    const poolSnapshotId = encodePoolVolumeAndSnapshotId(
      poolKey,
      intervalType,
      timestampForAcc,
    )

    let poolSnapshot = PoolSnapshot.load(poolSnapshotId)
    if (poolSnapshot === null) {
      poolSnapshot = new PoolSnapshot(poolSnapshotId)
      poolSnapshot.poolKey = poolKey.toHexString()
      poolSnapshot.intervalType = intervalType
      poolSnapshot.timestamp = BigInt.fromI64(timestampForAcc)
      poolSnapshot.price = event.params.oraclePrice
      poolSnapshot.liquidityA = totalLiquidityA
      poolSnapshot.liquidityB = totalLiquidityB
      poolSnapshot.totalSupply = totalSupply
      poolSnapshot.save()
    }
  }
}
