import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Burn, Rebalance, Rebalancer } from '../generated/Rebalancer/Rebalancer'
import {
  SimpleOracleStrategy,
  UpdatePrice,
} from '../generated/SimpleOracleStrategy/SimpleOracleStrategy'
import { Controller } from '../generated/BookManager/Controller'
import { PoolSnapshot, PoolVolume } from '../generated/schema'

import {
  getControllerAddress,
  getRebalancerAddress,
  getSimpleOracleStrategyAddress,
} from './addresses'
import {
  baseToQuote,
  buildPoolSnapshotId,
  buildPoolVolumeId,
  CHART_LOG_INTERVALS,
} from './helpers'

export function handleBurn(event: Burn): void {
  const controller = Controller.bind(Address.fromString(getControllerAddress()))
  const strategy = SimpleOracleStrategy.bind(
    Address.fromString(getSimpleOracleStrategyAddress()),
  )

  const poolKey = event.params.key
  const currencyAClaimedAmount = BigInt.zero() // TODO: replace with event params after contract update
  const currencyBClaimedAmount = BigInt.zero() // TODO: replace with event params after contract update
  const strategyPrice = strategy.getPrice(poolKey)
  const bookAPrice = controller.toPrice(strategyPrice.tickA) // TODO: resetOrders should be added to contract before production launch
  const bookBPrice = controller.toPrice(strategyPrice.tickB) // TODO: resetOrders should be added to contract before production launch

  const bookACurrencyAVolume = baseToQuote(currencyBClaimedAmount, bookAPrice)
  const bookACurrencyBVolume = currencyBClaimedAmount
  const bookBCurrencyAVolume = currencyAClaimedAmount
  const bookBCurrencyBVolume = baseToQuote(currencyAClaimedAmount, bookBPrice)
  const totalCurrencyAVolume = bookACurrencyAVolume.plus(bookBCurrencyAVolume)
  const totalCurrencyBVolume = bookACurrencyBVolume.plus(bookBCurrencyBVolume)

  const intervalEntry = CHART_LOG_INTERVALS.getEntry('1d')! // only use 1d interval for now
  const intervalType = intervalEntry.key
  const intervalInNumber = intervalEntry.value
  const timestampForAcc = (Math.floor(
    (event.block.timestamp.toI64() as number) / intervalInNumber,
  ) * intervalInNumber) as i64

  const poolVolumeId = buildPoolVolumeId(poolKey, intervalType, timestampForAcc)
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

export function handleRebalance(event: Rebalance): void {
  const controller = Controller.bind(Address.fromString(getControllerAddress()))
  const strategy = SimpleOracleStrategy.bind(
    Address.fromString(getSimpleOracleStrategyAddress()),
  )

  const poolKey = event.params.key
  const currencyAClaimedAmount = BigInt.zero() // TODO: replace with event params after contract update
  const currencyBClaimedAmount = BigInt.zero() // TODO: replace with event params after contract update
  const strategyPrice = strategy.getPrice(poolKey)
  const bookAPrice = controller.toPrice(strategyPrice.tickA) // TODO: resetOrders should be added to contract before production launch
  const bookBPrice = controller.toPrice(strategyPrice.tickB) // TODO: resetOrders should be added to contract before production launch

  const bookACurrencyAVolume = baseToQuote(currencyBClaimedAmount, bookAPrice)
  const bookACurrencyBVolume = currencyBClaimedAmount
  const bookBCurrencyAVolume = currencyAClaimedAmount
  const bookBCurrencyBVolume = baseToQuote(currencyAClaimedAmount, bookBPrice)
  const totalCurrencyAVolume = bookACurrencyAVolume.plus(bookBCurrencyAVolume)
  const totalCurrencyBVolume = bookACurrencyBVolume.plus(bookBCurrencyBVolume)

  const intervalEntry = CHART_LOG_INTERVALS.getEntry('1d')! // only use 1d interval for now
  const intervalType = intervalEntry.key
  const intervalInNumber = intervalEntry.value
  const timestampForAcc = (Math.floor(
    (event.block.timestamp.toI64() as number) / intervalInNumber,
  ) * intervalInNumber) as i64

  const poolVolumeId = buildPoolVolumeId(poolKey, intervalType, timestampForAcc)
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

export function handleUpdatePrice(event: UpdatePrice): void {
  const poolKey = event.params.key
  const rebalancer = Rebalancer.bind(Address.fromString(getRebalancerAddress()))
  const liquidity = rebalancer.getLiquidity(poolKey)
  const liquidityA = liquidity.getLiquidityA()
  const liquidityB = liquidity.getLiquidityB()
  const totalLiquidityA = liquidityA.reserve
    .plus(liquidityA.cancelable)
    .plus(liquidityA.claimable)
  const totalLiquidityB = liquidityB.reserve
    .plus(liquidityB.cancelable)
    .plus(liquidityB.claimable)
  const totalSupply = rebalancer.totalSupply(
    BigInt.fromString(poolKey.toHexString()),
  )

  const poolSnapshotId = buildPoolSnapshotId(
    poolKey,
    event.block.timestamp.toI64(),
  )
  let poolSnapshot = PoolSnapshot.load(poolSnapshotId)
  if (poolSnapshot === null) {
    poolSnapshot = new PoolSnapshot(poolSnapshotId)
    poolSnapshot.poolKey = poolKey.toHexString()
    poolSnapshot.timestamp = event.block.timestamp
    poolSnapshot.price = event.params.oraclePrice
    poolSnapshot.liquidityA = totalLiquidityA
    poolSnapshot.liquidityB = totalLiquidityB
    poolSnapshot.totalSupply = totalSupply
    poolSnapshot.save()
  }
}
