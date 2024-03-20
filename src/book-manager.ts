import { Address, BigInt, store } from '@graphprotocol/graph-ts'

import {
  BookManager,
  Cancel,
  Claim,
  Make,
  Open,
  Take,
  Transfer,
} from '../generated/BookManager/BookManager'
import { Book, ChartLog, Depth, OpenOrder, Token } from '../generated/schema'
import { Controller } from '../generated/BookManager/Controller'

import {
  ADDRESS_ZERO,
  buildChartLogId,
  buildDepthId,
  buildMarketCode,
  CHART_LOG_INTERVALS,
  createToken,
  decodeBookIdFromOrderId,
  encodeOrderId,
  formatPrice,
  formatUnits,
  rawToBase,
  rawToQuote,
} from './helpers'
import { getControllerAddress } from './addresses'

export function handleOpen(event: Open): void {
  const base = createToken(event.params.base)
  const quote = createToken(event.params.quote)
  const book = new Book(event.params.id.toString())
  book.base = base.id
  book.quote = quote.id
  book.unit = event.params.unit
  book.makerPolicy = BigInt.fromI32(event.params.makerPolicy)
  book.takerPolicy = BigInt.fromI32(event.params.takerPolicy)
  book.hooks = event.params.hooks.toHexString()
  book.latestTick = BigInt.zero()
  book.latestPrice = BigInt.zero()
  book.save()
}

export function handleMake(event: Make): void {
  const book = Book.load(event.params.bookId.toString())
  if (book === null) {
    return
  }
  const controller = Controller.bind(Address.fromString(getControllerAddress()))
  const bookManager = BookManager.bind(event.address)
  const user = event.params.user.toHexString()
  const tick = BigInt.fromI32(event.params.tick)
  const orderIndex = event.params.orderIndex
  const rawAmount = event.params.amount
  const price = controller.toPrice(tick.toI32())
  const baseAmount = rawToBase(book, rawAmount, price)
  const quoteAmount = rawToQuote(book, rawAmount)
  const orderId = encodeOrderId(book.id, tick, orderIndex)
  const orderInfo = bookManager.getOrder(orderId)

  // update open order
  const openOrder = new OpenOrder(orderId.toString())
  openOrder.book = book.id
  openOrder.tick = tick
  openOrder.orderIndex = orderIndex
  openOrder.price = price
  openOrder.user = user
  openOrder.txHash = event.transaction.hash.toHexString()
  openOrder.createdAt = event.block.timestamp
  openOrder.rawAmount = rawAmount
  openOrder.baseAmount = baseAmount
  openOrder.quoteAmount = quoteAmount
  openOrder.rawFilledAmount = BigInt.zero()
  openOrder.baseFilledAmount = BigInt.zero()
  openOrder.quoteFilledAmount = BigInt.zero()
  openOrder.rawClaimedAmount = BigInt.zero()
  openOrder.baseClaimedAmount = BigInt.zero()
  openOrder.quoteClaimedAmount = BigInt.zero()
  openOrder.rawClaimableAmount = orderInfo.claimable
  openOrder.baseClaimableAmount = rawToBase(book, orderInfo.claimable, price)
  openOrder.quoteClaimableAmount = rawToQuote(book, orderInfo.claimable)
  openOrder.rawOpenAmount = orderInfo.open
  openOrder.baseOpenAmount = rawToBase(book, orderInfo.open, price)
  openOrder.quoteOpenAmount = rawToQuote(book, orderInfo.open)
  openOrder.save()

  // update depth
  const rawDepthAmount = bookManager.getDepth(
    BigInt.fromString(book.id),
    tick.toI32(),
  )
  const depthId = buildDepthId(book.id, tick)
  let depth = Depth.load(depthId)
  if (depth === null) {
    depth = new Depth(depthId)
    depth.book = book.id
    depth.tick = tick
    depth.price = price
    depth.latestTakenOrderIndex = BigInt.zero()
  }
  depth.rawAmount = rawDepthAmount
  depth.baseAmount = rawToBase(book, rawDepthAmount, price)
  depth.quoteAmount = rawToQuote(book, rawDepthAmount)

  if (rawDepthAmount.isZero()) {
    store.remove('Depth', depthId)
  } else {
    depth.save()
  }
}

export function handleTake(event: Take): void {
  const bookManager = BookManager.bind(event.address)
  const controller = Controller.bind(Address.fromString(getControllerAddress()))

  // update book
  const book = Book.load(event.params.bookId.toString())
  if (book === null) {
    return
  }
  const tick = BigInt.fromI32(event.params.tick)
  const price = controller.toPrice(tick.toI32())
  book.latestTick = tick
  book.latestPrice = price
  book.save()

  // update depth & open order
  const depthId = buildDepthId(book.id, tick)
  const depth = Depth.load(depthId)
  if (depth === null) {
    return
  }
  const rawDepthAmount = bookManager.getDepth(
    BigInt.fromString(book.id),
    tick.toI32(),
  )
  depth.rawAmount = rawDepthAmount
  depth.baseAmount = rawToBase(book, rawDepthAmount, price)
  depth.quoteAmount = rawToQuote(book, rawDepthAmount)

  let currentOrderIndex = depth.latestTakenOrderIndex
  let remainingTakenRawAmount = event.params.amount
  while (remainingTakenRawAmount.gt(BigInt.zero())) {
    const orderId = encodeOrderId(book.id, tick, currentOrderIndex)
    const openOrder = OpenOrder.load(orderId.toString())
    if (openOrder === null) {
      currentOrderIndex = currentOrderIndex.plus(BigInt.fromI32(1))
      continue
    }
    const orderInfo = bookManager.getOrder(orderId)
    openOrder.rawClaimableAmount = orderInfo.claimable
    openOrder.baseClaimableAmount = rawToBase(
      book,
      orderInfo.claimable,
      openOrder.price,
    )
    openOrder.quoteClaimableAmount = rawToQuote(book, orderInfo.claimable)
    openOrder.rawOpenAmount = orderInfo.open
    openOrder.baseOpenAmount = rawToBase(book, orderInfo.open, openOrder.price)
    openOrder.quoteOpenAmount = rawToQuote(book, orderInfo.open)

    const openOrderRemainingRawAmount = openOrder.rawAmount.minus(
      openOrder.rawFilledAmount,
    )
    const filledRawAmount = remainingTakenRawAmount.lt(
      openOrderRemainingRawAmount,
    )
      ? remainingTakenRawAmount
      : openOrderRemainingRawAmount

    remainingTakenRawAmount = remainingTakenRawAmount.minus(filledRawAmount)
    const newRawFilledAmount = openOrder.rawFilledAmount.plus(filledRawAmount)
    openOrder.rawFilledAmount = newRawFilledAmount
    openOrder.baseFilledAmount = rawToBase(
      book,
      newRawFilledAmount,
      openOrder.price,
    )
    openOrder.quoteFilledAmount = rawToQuote(book, newRawFilledAmount)
    openOrder.save()

    if (openOrder.rawAmount == openOrder.rawFilledAmount) {
      currentOrderIndex = currentOrderIndex.plus(BigInt.fromI32(1))
    }
  }

  depth.latestTakenOrderIndex = currentOrderIndex

  if (rawDepthAmount.isZero()) {
    store.remove('Depth', depthId)
  } else {
    depth.save()
  }

  // update chart
  const baseTakenAmount = rawToBase(book, event.params.amount, price)
  const baseToken = Token.load(book.base) as Token
  const quoteToken = Token.load(book.quote) as Token
  const formattedPrice = formatPrice(price)
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
    const chartLogId = buildChartLogId(
      baseToken,
      quoteToken,
      intervalType,
      timestampForAcc,
    )
    const marketCode = buildMarketCode(baseToken, quoteToken)
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
    } else {
      if (formattedPrice.gt(chartLog.high)) {
        chartLog.high = formattedPrice
      }
      if (formattedPrice.lt(chartLog.low)) {
        chartLog.low = formattedPrice
      }
      chartLog.close = formattedPrice
      chartLog.baseVolume = chartLog.baseVolume.plus(formattedBaseTakenAmount)
    }
    chartLog.save()
  }
}

export function handleCancel(event: Cancel): void {
  const bookManager = BookManager.bind(event.address)
  const orderId = event.params.orderId
  const bookId = decodeBookIdFromOrderId(orderId)
  const book = Book.load(bookId)
  const openOrder = OpenOrder.load(orderId.toString())
  if (openOrder === null || book === null) {
    return
  }
  const orderInfo = bookManager.getOrder(orderId)
  const newRawAmount = openOrder.rawAmount.minus(event.params.canceledAmount)
  openOrder.rawAmount = newRawAmount
  openOrder.baseAmount = rawToBase(book, newRawAmount, openOrder.price)
  openOrder.quoteAmount = rawToQuote(book, newRawAmount)

  openOrder.rawOpenAmount = orderInfo.open
  openOrder.baseOpenAmount = rawToBase(book, orderInfo.open, openOrder.price)
  openOrder.quoteOpenAmount = rawToQuote(book, orderInfo.open)

  const rawPendingAmount = orderInfo.open.plus(orderInfo.claimable)
  if (rawPendingAmount.isZero()) {
    store.remove('OpenOrder', orderId.toString())
  } else {
    openOrder.save()
  }

  // update depth
  const depthId = buildDepthId(book.id, openOrder.tick)
  const depth = Depth.load(depthId)
  if (depth === null) {
    return
  }
  const rawDepthAmount = bookManager.getDepth(
    BigInt.fromString(book.id),
    openOrder.tick.toI32(),
  )
  depth.rawAmount = rawDepthAmount
  depth.baseAmount = rawToBase(book, rawDepthAmount, openOrder.price)
  depth.quoteAmount = rawToQuote(book, rawDepthAmount)

  if (rawDepthAmount.isZero()) {
    store.remove('Depth', depthId)
  } else {
    depth.save()
  }
}

export function handleClaim(event: Claim): void {
  const bookManager = BookManager.bind(event.address)
  const orderId = event.params.orderId
  const bookId = decodeBookIdFromOrderId(orderId)
  const openOrder = OpenOrder.load(orderId.toString())
  const book = Book.load(bookId)
  if (openOrder === null || book === null) {
    return
  }
  const orderInfo = bookManager.getOrder(orderId)
  const newRawClaimedAmount = openOrder.rawClaimedAmount.plus(
    event.params.rawAmount,
  )

  openOrder.rawClaimedAmount = newRawClaimedAmount
  openOrder.baseClaimedAmount = rawToBase(
    book,
    newRawClaimedAmount,
    openOrder.price,
  )
  openOrder.quoteClaimedAmount = rawToQuote(book, newRawClaimedAmount)

  openOrder.rawClaimableAmount = orderInfo.claimable
  openOrder.baseClaimableAmount = rawToBase(
    book,
    orderInfo.claimable,
    openOrder.price,
  )
  openOrder.quoteClaimableAmount = rawToQuote(book, orderInfo.claimable)

  const rawPendingAmount = orderInfo.open.plus(orderInfo.claimable)
  if (rawPendingAmount.isZero()) {
    store.remove('OpenOrder', orderId.toString())
  } else {
    openOrder.save()
  }
}

export function handleTransfer(event: Transfer): void {
  const from = event.params.from.toHexString()
  const to = event.params.to.toHexString()
  const orderId = event.params.tokenId

  if (from == ADDRESS_ZERO || to == ADDRESS_ZERO) {
    // mint or burn events are handled in the make, cancel, and claim events
    return
  }

  const openOrder = OpenOrder.load(orderId.toString())

  if (openOrder === null) {
    return
  }

  openOrder.user = to
  openOrder.save()
}
