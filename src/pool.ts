import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Claim, Rebalancer } from '../generated/Rebalancer/Rebalancer'
import {
  SimpleOracleStrategy,
  UpdatePosition,
} from '../generated/SimpleOracleStrategy/SimpleOracleStrategy'
import { PoolSnapshot, PoolVolume } from '../generated/schema'
import { Controller } from '../generated/Rebalancer/Controller'

import {
  getControllerAddress,
  getRebalancerAddress,
  getSimpleOracleStrategyAddress,
} from './addresses'
import {
  baseToQuote,
  buildPoolVolumeAndSnapshotId,
  bytestToBigIntBigEndian,
  CHART_LOG_INTERVALS,
} from './helpers'

export function handleRebalancerClaim(event: Claim): void {
  const controller = Controller.bind(Address.fromString(getControllerAddress()))
  const strategy = SimpleOracleStrategy.bind(
    Address.fromString(getSimpleOracleStrategyAddress()),
  )

  const poolKey = event.params.key
  const currencyAClaimedAmount = event.params.claimedAmountA
  const currencyBClaimedAmount = event.params.claimedAmountB
  const strategyPrice = strategy.getPosition(poolKey)
  const bookAPrice = controller.toPrice(strategyPrice.tickA)
  const bookBPrice = controller.toPrice(strategyPrice.tickB)

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

  const poolVolumeId = buildPoolVolumeAndSnapshotId(
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
  const totalSupply = rebalancer.totalSupply(bytestToBigIntBigEndian(poolKey))

  for (let i = 0; i < CHART_LOG_INTERVALS.entries.length; i++) {
    const intervalEntry = CHART_LOG_INTERVALS.entries[i]
    const intervalType = intervalEntry.key
    const intervalInNumber = intervalEntry.value
    const timestampForAcc = (Math.floor(
      (event.block.timestamp.toI64() as number) / intervalInNumber,
    ) * intervalInNumber) as i64

    const poolSnapshotId = buildPoolVolumeAndSnapshotId(
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
