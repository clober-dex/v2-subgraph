import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
  store,
} from '@graphprotocol/graph-ts'

import {
  Cancel,
  Claim,
  Make,
  Open,
  Take,
  Transfer,
} from '../../generated/BookManager/BookManager'
import {
  Book,
  ChartLog,
  Depth,
  LatestBlock,
  OpenOrder,
  OrderIndex,
  Token,
} from '../../generated/schema'
import {
  getOrCreateSnapshot,
  getOrCreateVolumeSnapshot,
  getLatestPoolSpread,
  getPoolSpreadProfit,
  updateTransactionsInSnapshot,
  updateWalletsInSnapshot,
  updateWalletVolumeSnapshot,
  updateBookTransactionsAndTransactionsInSnapshot,
} from '../helpers'
import {
  ADDRESS_ZERO,
  CHART_LOG_INTERVALS,
  formatInvertedPrice,
  formatPrice,
  formatUnits,
  getPendingAmount,
  unitToBase,
  unitToQuote,
  getRebalancerAddress,
  encodeOrderId,
  decodeBookIdFromOrderId,
  encodeDepthId,
  encodeChartLogId,
  encodeMarketCode,
  tickToPrice,
} from '../utils'
import { loadOrCreateToken } from '../repositories'

export function handleBlock(block: ethereum.Block): void {
  const latestBlockId: string = 'latest'
  let latestBlock = LatestBlock.load(latestBlockId)
  if (latestBlock === null) {
    latestBlock = new LatestBlock(latestBlockId)
  }
  latestBlock.blockNumber = block.number
  latestBlock.timestamp = block.timestamp
  latestBlock.save()
}

export function handleOpen(event: Open): void {
  const base = loadOrCreateToken(event.params.base)
  const quote = loadOrCreateToken(event.params.quote)
  const book = new Book(event.params.id.toString())
  book.base = base.id
  book.quote = quote.id
  book.unitSize = event.params.unitSize
  book.makerPolicy = BigInt.fromI32(event.params.makerPolicy)
  book.takerPolicy = BigInt.fromI32(event.params.takerPolicy)
  book.hooks = event.params.hooks.toHexString()
  book.latestTick = BigInt.zero()
  book.latestPrice = BigInt.zero()
  book.latestTimestamp = BigInt.zero()
  book.createAt = event.block.timestamp
  book.save()

  updateWalletsInSnapshot(
    getOrCreateSnapshot(event.block.timestamp),
    event.transaction.from,
  )
  updateTransactionsInSnapshot(
    getOrCreateSnapshot(event.block.timestamp),
    event.transaction.hash,
  )
}

export function handleMake(event: Make): void {
  const book = Book.load(event.params.bookId.toString())
  if (book === null) {
    log.error('[MAKE] Book not found: {}', [event.params.bookId.toString()])
    return
  }
  const user = event.params.user
  const tick = BigInt.fromI32(event.params.tick)
  const orderIndex = event.params.orderIndex
  const unitAmount = event.params.unit
  const price = tickToPrice(tick.toI32())
  const baseAmount = unitToBase(book, unitAmount, price)
  const quoteAmount = unitToQuote(book, unitAmount)
  const orderId = encodeOrderId(book.id, tick, orderIndex)

  // update open order
  const openOrder = new OpenOrder(orderId.toString())
  openOrder.book = book.id
  openOrder.tick = tick
  openOrder.orderIndex = orderIndex
  openOrder.price = price
  openOrder.user = user.toHexString()
  openOrder.txHash = event.transaction.hash.toHexString()
  openOrder.createdAt = event.block.timestamp
  openOrder.unitAmount = unitAmount
  openOrder.baseAmount = baseAmount
  openOrder.quoteAmount = quoteAmount
  openOrder.unitFilledAmount = BigInt.zero()
  openOrder.baseFilledAmount = BigInt.zero()
  openOrder.quoteFilledAmount = BigInt.zero()
  openOrder.unitClaimedAmount = BigInt.zero()
  openOrder.baseClaimedAmount = BigInt.zero()
  openOrder.quoteClaimedAmount = BigInt.zero()
  openOrder.unitClaimableAmount = BigInt.zero()
  openOrder.baseClaimableAmount = BigInt.zero()
  openOrder.quoteClaimableAmount = BigInt.zero()
  openOrder.unitOpenAmount = unitAmount
  openOrder.baseOpenAmount = baseAmount
  openOrder.quoteOpenAmount = quoteAmount
  openOrder.save()

  // update depth
  const depthId = encodeDepthId(book.id, tick)
  let depth = Depth.load(depthId)
  let orderIndexEntity = OrderIndex.load(depthId)
  if (depth === null) {
    depth = new Depth(depthId)
    depth.book = book.id
    depth.tick = tick
    depth.price = price
    depth.unitAmount = BigInt.zero()
    depth.baseAmount = BigInt.zero()
    depth.quoteAmount = BigInt.zero()
  }
  if (orderIndexEntity === null) {
    orderIndexEntity = new OrderIndex(depthId)
    orderIndexEntity.book = book.id
    orderIndexEntity.tick = tick
    orderIndexEntity.price = price
    orderIndexEntity.latestTakenOrderIndex = BigInt.zero()
  }
  const newUnitAmount = depth.unitAmount.plus(unitAmount)
  depth.unitAmount = newUnitAmount
  depth.baseAmount = unitToBase(book, newUnitAmount, price)
  depth.quoteAmount = unitToQuote(book, newUnitAmount)

  if (user.equals(getRebalancerAddress())) {
    const baseToken = Token.load(book.base) as Token
    const quoteToken = Token.load(book.quote) as Token

    const latestPoolSpread = getLatestPoolSpread()
    if (tick.le(BigInt.zero())) {
      // bid
      const formattedPrice = formatPrice(
        price,
        baseToken.decimals,
        quoteToken.decimals,
      )
      latestPoolSpread.bidTick = tick
      latestPoolSpread.bidPrice = formattedPrice
    } else {
      // ask
      const formattedInvertedPrice = formatInvertedPrice(
        price,
        baseToken.decimals,
        quoteToken.decimals,
      )
      latestPoolSpread.askTick = tick
      latestPoolSpread.askPrice = formattedInvertedPrice
    }
    latestPoolSpread.save()
  }

  depth.save()
  orderIndexEntity.save()

  updateWalletsInSnapshot(
    getOrCreateSnapshot(event.block.timestamp),
    event.transaction.from,
  )
  updateBookTransactionsAndTransactionsInSnapshot(
    getOrCreateSnapshot(event.block.timestamp),
    event.transaction.hash,
    book,
    true,
  )
}

export function handleTake(event: Take): void {
  if (event.params.unit.isZero()) {
    return
  }

  // update book
  const book = Book.load(event.params.bookId.toString())
  if (book === null) {
    log.error('[TAKE] Book not found: {}', [event.params.bookId.toString()])
    return
  }
  const tick = BigInt.fromI32(event.params.tick)
  const price = tickToPrice(tick.toI32())
  book.latestTick = tick
  book.latestPrice = price
  book.latestTimestamp = event.block.timestamp
  book.save()

  // update depth & open order
  const depthId = encodeDepthId(book.id, tick)
  const depth = Depth.load(depthId)
  const orderIndexEntity = OrderIndex.load(depthId)
  if (depth === null || orderIndexEntity === null) {
    log.error('[TAKE] Depth or OrderIndex not found: {}', [depthId])
    return
  }
  const takenUnitAmount = event.params.unit
  const newUnitAmount = depth.unitAmount.minus(takenUnitAmount)
  depth.unitAmount = newUnitAmount
  depth.baseAmount = unitToBase(book, newUnitAmount, price)
  depth.quoteAmount = unitToQuote(book, newUnitAmount)

  if (newUnitAmount.lt(BigInt.zero())) {
    log.error('[TAKE] Negative depth unit amount: {}', [depthId])
  }

  let currentOrderIndex = orderIndexEntity.latestTakenOrderIndex
  let remainingTakenUnitAmount = event.params.unit
  while (remainingTakenUnitAmount.gt(BigInt.zero())) {
    const orderId = encodeOrderId(book.id, tick, currentOrderIndex)
    const openOrder = OpenOrder.load(orderId.toString())
    if (openOrder === null) {
      currentOrderIndex = currentOrderIndex.plus(BigInt.fromI32(1))
      continue
    }

    const openOrderRemainingUnitAmount = openOrder.unitAmount.minus(
      openOrder.unitFilledAmount,
    )
    const filledUnitAmount = remainingTakenUnitAmount.lt(
      openOrderRemainingUnitAmount,
    )
      ? remainingTakenUnitAmount
      : openOrderRemainingUnitAmount

    remainingTakenUnitAmount = remainingTakenUnitAmount.minus(filledUnitAmount)
    const newUnitFilledAmount =
      openOrder.unitFilledAmount.plus(filledUnitAmount)
    openOrder.unitFilledAmount = newUnitFilledAmount
    openOrder.baseFilledAmount = unitToBase(
      book,
      newUnitFilledAmount,
      openOrder.price,
    )
    openOrder.quoteFilledAmount = unitToQuote(book, newUnitFilledAmount)

    const newUnitClaimableAmount =
      openOrder.unitClaimableAmount.plus(filledUnitAmount)
    openOrder.unitClaimableAmount = newUnitClaimableAmount
    openOrder.baseClaimableAmount = unitToBase(
      book,
      newUnitClaimableAmount,
      openOrder.price,
    )
    openOrder.quoteClaimableAmount = unitToQuote(book, newUnitClaimableAmount)

    const newUnitOpenAmount = openOrder.unitOpenAmount.minus(filledUnitAmount)
    openOrder.unitOpenAmount = newUnitOpenAmount
    openOrder.baseOpenAmount = unitToBase(
      book,
      newUnitOpenAmount,
      openOrder.price,
    )
    openOrder.quoteOpenAmount = unitToQuote(book, newUnitOpenAmount)
    if (newUnitOpenAmount.lt(BigInt.zero())) {
      log.error('[TAKE] Negative open unit amount: {}', [orderId.toString()])
    }
    openOrder.save()

    updateWalletVolumeSnapshot(
      event.block.timestamp,
      Address.fromString(openOrder.user),
      Address.fromString(book.quote),
      unitToQuote(book, newUnitFilledAmount),
    )

    if (openOrder.unitAmount == openOrder.unitFilledAmount) {
      currentOrderIndex = currentOrderIndex.plus(BigInt.fromI32(1))
    }
  }

  orderIndexEntity.latestTakenOrderIndex = currentOrderIndex
  orderIndexEntity.save()

  // update chart
  const baseTakenAmount = unitToBase(book, event.params.unit, price)
  const quoteTakenAmount = unitToQuote(book, event.params.unit)
  const baseToken = Token.load(book.base) as Token
  const quoteToken = Token.load(book.quote) as Token
  const formattedPrice = formatPrice(
    price,
    baseToken.decimals,
    quoteToken.decimals,
  )
  const formattedBaseTakenAmount = formatUnits(
    baseTakenAmount,
    baseToken.decimals.toI32() as u8,
  )
  for (let i = 0; i < CHART_LOG_INTERVALS.entries.length; i++) {
    const entry = CHART_LOG_INTERVALS.entries[i]
    const intervalType = entry.key
    const intervalInNumber = entry.value
    const timestampForAcc = (Math.floor(
      (event.block.timestamp.toI64() as number) / intervalInNumber,
    ) * intervalInNumber) as i64

    // natural chart log
    const chartLogId = encodeChartLogId(
      baseToken,
      quoteToken,
      intervalType,
      timestampForAcc,
    )
    const marketCode = encodeMarketCode(baseToken, quoteToken)
    let chartLog = ChartLog.load(chartLogId)
    if (chartLog === null) {
      chartLog = new ChartLog(chartLogId)
      chartLog.marketCode = marketCode
      chartLog.intervalType = intervalType
      chartLog.timestamp = BigInt.fromI64(timestampForAcc)
      chartLog.open = formattedPrice
      chartLog.high = formattedPrice
      chartLog.low = formattedPrice
      chartLog.close = formattedPrice
      chartLog.baseVolume = formattedBaseTakenAmount
      chartLog.bidBookBaseVolume = formattedBaseTakenAmount
      chartLog.askBookBaseVolume = BigDecimal.zero()
    } else {
      if (formattedPrice.gt(chartLog.high)) {
        chartLog.high = formattedPrice
      }
      if (formattedPrice.lt(chartLog.low)) {
        chartLog.low = formattedPrice
      }
      chartLog.close = formattedPrice
      chartLog.baseVolume = chartLog.baseVolume.plus(formattedBaseTakenAmount)
      chartLog.bidBookBaseVolume = chartLog.bidBookBaseVolume.plus(
        formattedBaseTakenAmount,
      )
    }
    chartLog.save()

    // inverted chart log
    const formattedInvertedPrice = formatInvertedPrice(
      price,
      baseToken.decimals,
      quoteToken.decimals,
    )
    const formattedQuoteTakenAmount = formatUnits(
      quoteTakenAmount,
      quoteToken.decimals.toI32() as u8,
    )
    const invertedChartLogId = encodeChartLogId(
      quoteToken,
      baseToken,
      intervalType,
      timestampForAcc,
    )
    const invertedMarketCode = encodeMarketCode(quoteToken, baseToken)
    let invertedChartLog = ChartLog.load(invertedChartLogId)
    if (invertedChartLog === null) {
      invertedChartLog = new ChartLog(invertedChartLogId)
      invertedChartLog.marketCode = invertedMarketCode
      invertedChartLog.intervalType = intervalType
      invertedChartLog.timestamp = BigInt.fromI64(timestampForAcc)
      invertedChartLog.open = formattedInvertedPrice
      invertedChartLog.high = formattedInvertedPrice
      invertedChartLog.low = formattedInvertedPrice
      invertedChartLog.close = formattedInvertedPrice
      invertedChartLog.baseVolume = formattedQuoteTakenAmount
      invertedChartLog.bidBookBaseVolume = BigDecimal.zero()
      invertedChartLog.askBookBaseVolume = formattedQuoteTakenAmount
    } else {
      if (formattedInvertedPrice.gt(invertedChartLog.high)) {
        invertedChartLog.high = formattedInvertedPrice
      }
      if (formattedInvertedPrice.lt(invertedChartLog.low)) {
        invertedChartLog.low = formattedInvertedPrice
      }
      invertedChartLog.close = formattedInvertedPrice
      invertedChartLog.baseVolume = invertedChartLog.baseVolume.plus(
        formattedQuoteTakenAmount,
      )
      invertedChartLog.askBookBaseVolume =
        invertedChartLog.askBookBaseVolume.plus(formattedQuoteTakenAmount)
    }
    invertedChartLog.save()
  }

  if (depth.unitAmount.isZero()) {
    store.remove('Depth', depthId)
  } else {
    depth.save()
  }

  const snapshot = getOrCreateSnapshot(event.block.timestamp)
  const volumeSnapshot = getOrCreateVolumeSnapshot(
    event.block.timestamp,
    Address.fromString(book.quote),
  )
  volumeSnapshot.amount = volumeSnapshot.amount.plus(
    unitToQuote(book, takenUnitAmount),
  )
  volumeSnapshot.save()

  let find = false
  for (let i = 0; i < snapshot.volumeSnapshots.length; i++) {
    if (snapshot.volumeSnapshots[i] == volumeSnapshot.id) {
      find = true
      break
    }
  }
  if (!find) {
    const volumeSnapshots = snapshot.volumeSnapshots
    volumeSnapshots.push(volumeSnapshot.id)
    snapshot.volumeSnapshots = volumeSnapshots
  }
  snapshot.save()

  updateWalletsInSnapshot(
    getOrCreateSnapshot(event.block.timestamp),
    event.transaction.from,
  )
  updateBookTransactionsAndTransactionsInSnapshot(
    getOrCreateSnapshot(event.block.timestamp),
    event.transaction.hash,
    book,
    false,
  )

  updateWalletVolumeSnapshot(
    event.block.timestamp,
    event.transaction.from,
    Address.fromString(book.base),
    baseTakenAmount,
  )
}

export function handleCancel(event: Cancel): void {
  if (event.params.unit.isZero()) {
    return
  }
  const orderId = event.params.orderId
  const bookId = decodeBookIdFromOrderId(orderId)
  const book = Book.load(bookId)
  const openOrder = OpenOrder.load(orderId.toString())
  if (openOrder === null || book === null) {
    log.error('[CANCEL] Book or OpenOrder not found: {} {}', [
      bookId,
      orderId.toString(),
    ])
    return
  }
  const newUnitAmount = openOrder.unitAmount.minus(event.params.unit)
  openOrder.unitAmount = newUnitAmount
  openOrder.baseAmount = unitToBase(book, newUnitAmount, openOrder.price)
  openOrder.quoteAmount = unitToQuote(book, newUnitAmount)

  if (newUnitAmount.lt(BigInt.zero())) {
    log.error('[CANCEL] Negative unit amount: {}', [orderId.toString()])
  }

  const newUnitOpenAmount = openOrder.unitOpenAmount.minus(event.params.unit)
  openOrder.unitOpenAmount = newUnitOpenAmount
  openOrder.baseOpenAmount = unitToBase(
    book,
    newUnitOpenAmount,
    openOrder.price,
  )
  openOrder.quoteOpenAmount = unitToQuote(book, newUnitOpenAmount)

  if (newUnitOpenAmount.lt(BigInt.zero())) {
    log.error('[CANCEL] Negative open unit amount: {}', [orderId.toString()])
  }

  const unitPendingAmount = getPendingAmount(openOrder)

  // update depth
  const depthId = encodeDepthId(book.id, openOrder.tick)
  const depth = Depth.load(depthId)
  if (depth === null) {
    log.error('[CANCEL] Depth not found: {}', [depthId])
    return
  }
  const newUnitDepthAmount = depth.unitAmount.minus(event.params.unit)
  depth.unitAmount = newUnitDepthAmount
  depth.baseAmount = unitToBase(book, newUnitDepthAmount, openOrder.price)
  depth.quoteAmount = unitToQuote(book, newUnitDepthAmount)

  if (newUnitDepthAmount.lt(BigInt.zero())) {
    log.error('[CANCEL] Negative depth unit amount: {}', [depthId])
  }

  if (unitPendingAmount.isZero()) {
    store.remove('OpenOrder', orderId.toString())
  } else {
    openOrder.save()
  }

  if (newUnitDepthAmount.isZero()) {
    store.remove('Depth', depthId)
  } else {
    depth.save()
  }

  updateWalletsInSnapshot(
    getOrCreateSnapshot(event.block.timestamp),
    event.transaction.from,
  )
  updateTransactionsInSnapshot(
    getOrCreateSnapshot(event.block.timestamp),
    event.transaction.hash,
  )
}

export function handleClaim(event: Claim): void {
  if (event.params.unit.isZero()) {
    return
  }
  const orderId = event.params.orderId
  const bookId = decodeBookIdFromOrderId(orderId)
  const openOrder = OpenOrder.load(orderId.toString())
  const book = Book.load(bookId)
  if (openOrder === null || book === null) {
    log.error('[CLAIM] Book or OpenOrder not found: {} {}', [
      bookId,
      orderId.toString(),
    ])
    return
  }
  const newUnitClaimedAmount = openOrder.unitClaimedAmount.plus(
    event.params.unit,
  )

  openOrder.unitClaimedAmount = newUnitClaimedAmount
  openOrder.baseClaimedAmount = unitToBase(
    book,
    newUnitClaimedAmount,
    openOrder.price,
  )
  openOrder.quoteClaimedAmount = unitToQuote(book, newUnitClaimedAmount)

  const newUnitClaimableAmount = openOrder.unitClaimableAmount.minus(
    event.params.unit,
  )
  openOrder.unitClaimableAmount = newUnitClaimableAmount
  openOrder.baseClaimableAmount = unitToBase(
    book,
    newUnitClaimableAmount,
    openOrder.price,
  )
  openOrder.quoteClaimableAmount = unitToQuote(book, newUnitClaimableAmount)

  if (newUnitClaimableAmount.lt(BigInt.zero())) {
    log.error('[CLAIM] Negative claimable unit amount: {}', [
      orderId.toString(),
    ])
  }

  if (Address.fromString(openOrder.user).equals(getRebalancerAddress())) {
    const baseToken = Token.load(book.base) as Token
    const quoteToken = Token.load(book.quote) as Token
    const claimedAmountInUnit = event.params.unit
    const claimedAmountInBase = unitToBase(
      book,
      claimedAmountInUnit,
      openOrder.price,
    )
    const claimedAmountInQuote = unitToQuote(book, claimedAmountInUnit)
    const formattedBaseClaimedAmount = formatUnits(
      claimedAmountInBase,
      baseToken.decimals.toI32() as u8,
    )
    const formattedQuoteClaimedAmount = formatUnits(
      claimedAmountInQuote,
      quoteToken.decimals.toI32() as u8,
    )
    const latestPoolSpread = getLatestPoolSpread()
    let spread = latestPoolSpread.askPrice.minus(latestPoolSpread.bidPrice)
    if (spread.lt(BigDecimal.zero())) {
      log.error('[CLAIM] Negative spread: askPrice: {}, bidPrice: {}', [
        latestPoolSpread.askPrice.toString(),
        latestPoolSpread.bidPrice.toString(),
      ])
      spread = BigDecimal.zero()
    }
    const poolSpreadProfit = getPoolSpreadProfit(event.block.timestamp)
    if (openOrder.tick.le(BigInt.zero())) {
      // bid
      poolSpreadProfit.accumulatedProfitInUsd =
        poolSpreadProfit.accumulatedProfitInUsd.plus(
          spread
            .div(BigDecimal.fromString('2'))
            .times(formattedBaseClaimedAmount),
        )
    } else {
      // ask
      poolSpreadProfit.accumulatedProfitInUsd =
        poolSpreadProfit.accumulatedProfitInUsd.plus(
          spread
            .div(BigDecimal.fromString('2'))
            .times(formattedQuoteClaimedAmount),
        )
    }
    poolSpreadProfit.save()
  }

  const unitPendingAmount = getPendingAmount(openOrder)
  if (unitPendingAmount.isZero()) {
    store.remove('OpenOrder', orderId.toString())
  } else {
    openOrder.save()
  }

  updateWalletsInSnapshot(
    getOrCreateSnapshot(event.block.timestamp),
    event.transaction.from,
  )
  updateTransactionsInSnapshot(
    getOrCreateSnapshot(event.block.timestamp),
    event.transaction.hash,
  )
}

export function handleTransfer(event: Transfer): void {
  const from = event.params.from
  const to = event.params.to
  const orderId = event.params.tokenId

  if (from.equals(ADDRESS_ZERO) || to.equals(ADDRESS_ZERO)) {
    // mint or burn events are handled in the make, cancel, and claim events
    return
  }

  const openOrder = OpenOrder.load(orderId.toString())

  if (openOrder === null) {
    log.error('[TRANSFER] OpenOrder not found: {}', [orderId.toString()])
    return
  }

  openOrder.user = to.toHexString()
  openOrder.save()
}
