import { BigDecimal, BigInt, ethereum, log } from '@graphprotocol/graph-ts'

import { Take } from '../../../generated/BookManager/BookManager'
import { unitToBase, unitToQuote } from '../../common/amount'
import { Book, ChartLog, OpenOrder, Token } from '../../../generated/schema'
import { encodeOrderID } from '../../common/order'
import { ONE_BI, ZERO_BD, ZERO_BI } from '../../common/constants'
import {
  getBookOrLog,
  getDepthOrLog,
  getTokenOrLog,
} from '../../common/entity-getters'
import { convertTokenToDecimal } from '../../common/utils'
import { calculateValueUSD, getTokenUSDPrice } from '../../common/pricing'
import {
  formatInvertedPrice,
  formatPrice,
  tickToPrice,
} from '../../common/tick'
import { updateBookDayData, updateTokenDayData } from '../interval-updates'
import {
  CHART_LOG_INTERVALS,
  encodeChartLogID,
  encodeMarketCode,
} from '../../common/chart'

function fillOpenOrder(
  openOrder: OpenOrder,
  unitSize: BigInt,
  quote: Token,
  quoteInUSD: BigDecimal,
  base: Token,
  baseInUSD: BigDecimal,
  filledUnitAmount: BigInt,
): void {
  const updatedFilledUnitAmount =
    openOrder.filledUnitAmount.plus(filledUnitAmount)
  openOrder.filledUnitAmount = updatedFilledUnitAmount
  openOrder.filledBaseAmount = unitToBase(
    unitSize,
    updatedFilledUnitAmount,
    openOrder.priceRaw,
  )
  openOrder.filledQuoteAmount = unitToQuote(unitSize, updatedFilledUnitAmount)

  openOrder.filledAmountUSD = calculateValueUSD(
    convertTokenToDecimal(openOrder.filledQuoteAmount, quote.decimals),
    quoteInUSD,
    convertTokenToDecimal(openOrder.filledBaseAmount, base.decimals),
    baseInUSD,
  )

  const claimableUnitAfterFill =
    openOrder.claimableUnitAmount.plus(filledUnitAmount)
  openOrder.claimableUnitAmount = claimableUnitAfterFill
  openOrder.claimableBaseAmount = unitToBase(
    unitSize,
    claimableUnitAfterFill,
    openOrder.priceRaw,
  )
  openOrder.claimableQuoteAmount = unitToQuote(unitSize, claimableUnitAfterFill)
  openOrder.claimableAmountUSD = calculateValueUSD(
    convertTokenToDecimal(openOrder.claimableQuoteAmount, quote.decimals),
    quoteInUSD,
    convertTokenToDecimal(openOrder.claimableBaseAmount, base.decimals),
    baseInUSD,
  )

  const remainingCancelableUnitAmount =
    openOrder.cancelableUnitAmount.minus(filledUnitAmount)
  openOrder.cancelableUnitAmount = remainingCancelableUnitAmount
  openOrder.cancelableBaseAmount = unitToBase(
    unitSize,
    remainingCancelableUnitAmount,
    openOrder.priceRaw,
  )
  openOrder.cancelableQuoteAmount = unitToQuote(
    unitSize,
    remainingCancelableUnitAmount,
  )
  openOrder.cancelableAmountUSD = calculateValueUSD(
    convertTokenToDecimal(openOrder.cancelableQuoteAmount, quote.decimals),
    quoteInUSD,
    convertTokenToDecimal(openOrder.cancelableBaseAmount, base.decimals),
    baseInUSD,
  )

  if (remainingCancelableUnitAmount.lt(ZERO_BI)) {
    log.error('[TAKE] Negative cancelable unit amount: {}', [openOrder.id])
  }

  openOrder.save()
}

function updateChart(
  block: ethereum.Block,
  takenBaseAmountDecimal: BigDecimal,
  takenQuoteAmountDecimal: BigDecimal,
  book: Book,
  base: Token,
  quote: Token,
): void {
  for (let i = 0; i < CHART_LOG_INTERVALS.entries.length; i++) {
    const entry = CHART_LOG_INTERVALS.entries[i]
    const intervalType = entry.key
    const intervalInNumber = entry.value
    const timestampForAcc = (Math.floor(
      (block.timestamp.toI64() as number) / intervalInNumber,
    ) * intervalInNumber) as i64

    // natural chart log
    const chartLogID = encodeChartLogID(
      base,
      quote,
      intervalType,
      timestampForAcc,
    )
    const marketCode = encodeMarketCode(base, quote)
    let chartLog = ChartLog.load(chartLogID)
    if (chartLog === null) {
      chartLog = new ChartLog(chartLogID)
      chartLog.marketCode = marketCode
      chartLog.intervalType = intervalType
      chartLog.timestamp = BigInt.fromI64(timestampForAcc)
      chartLog.open = book.price
      chartLog.high = book.price
      chartLog.low = book.price
      chartLog.close = book.price
      chartLog.baseVolume = takenBaseAmountDecimal
      chartLog.bidBookBaseVolume = takenBaseAmountDecimal
      chartLog.askBookBaseVolume = ZERO_BD
    } else {
      if (book.price.gt(chartLog.high)) {
        chartLog.high = book.price
      }
      if (book.price.lt(chartLog.low)) {
        chartLog.low = book.price
      }
      chartLog.close = book.price
      chartLog.baseVolume = chartLog.baseVolume.plus(takenBaseAmountDecimal)
      chartLog.bidBookBaseVolume = chartLog.bidBookBaseVolume.plus(
        takenBaseAmountDecimal,
      )
    }
    chartLog.save()

    // inverted chart log
    const invertedChartLogID = encodeChartLogID(
      quote,
      base,
      intervalType,
      timestampForAcc,
    )
    const invertedMarketCode = encodeMarketCode(quote, base)
    let invertedChartLog = ChartLog.load(invertedChartLogID)
    if (invertedChartLog === null) {
      invertedChartLog = new ChartLog(invertedChartLogID)
      invertedChartLog.marketCode = invertedMarketCode
      invertedChartLog.intervalType = intervalType
      invertedChartLog.timestamp = BigInt.fromI64(timestampForAcc)
      invertedChartLog.open = book.inversePrice
      invertedChartLog.high = book.inversePrice
      invertedChartLog.low = book.inversePrice
      invertedChartLog.close = book.inversePrice
      invertedChartLog.baseVolume = takenQuoteAmountDecimal
      invertedChartLog.bidBookBaseVolume = ZERO_BD
      invertedChartLog.askBookBaseVolume = takenQuoteAmountDecimal
    } else {
      if (book.inversePrice.gt(invertedChartLog.high)) {
        invertedChartLog.high = book.inversePrice
      }
      if (book.inversePrice.lt(invertedChartLog.low)) {
        invertedChartLog.low = book.inversePrice
      }
      invertedChartLog.close = book.inversePrice
      invertedChartLog.baseVolume = invertedChartLog.baseVolume.plus(
        takenQuoteAmountDecimal,
      )
      invertedChartLog.askBookBaseVolume =
        invertedChartLog.askBookBaseVolume.plus(takenQuoteAmountDecimal)
    }
    invertedChartLog.save()
  }
}

export function handleTake(event: Take): void {
  if (event.params.unit.isZero()) {
    return
  }
  const tick = BigInt.fromI32(event.params.tick)
  const priceRaw = tickToPrice(event.params.tick)
  const book = getBookOrLog(event.params.bookId.toString(), 'TAKE')
  if (book === null) {
    return
  }

  const depthID = event.params.bookId
    .toString()
    .concat('-')
    .concat(tick.toString())
  const depth = getDepthOrLog(depthID, 'TAKE')
  if (depth === null) {
    return
  }

  const quote = getTokenOrLog(book.quote, 'TAKE')
  const base = getTokenOrLog(book.base, 'TAKE')
  if (quote === null || base === null) {
    return
  }

  const takenUnitAmount = event.params.unit
  const takenBaseAmount = unitToBase(book.unitSize, takenUnitAmount, priceRaw)
  const takenBaseAmountDecimal = convertTokenToDecimal(
    takenBaseAmount,
    base.decimals,
  )
  const protocolFeesBase = !book.isTakerFeeInQuote
    ? takenBaseAmountDecimal.times(book.takerFee)
    : ZERO_BD

  const takenQuoteAmount = unitToQuote(book.unitSize, takenUnitAmount)
  const takenQuoteAmountDecimal = convertTokenToDecimal(
    takenQuoteAmount,
    quote.decimals,
  )
  const protocolFeesQuote = book.isTakerFeeInQuote
    ? takenQuoteAmountDecimal.times(book.takerFee)
    : ZERO_BD

  // book data
  book.price = formatPrice(priceRaw, base.decimals, quote.decimals) // this should be first

  const quoteInUSD = getTokenUSDPrice(quote)
  const baseInUSD = getTokenUSDPrice(base)
  const amountTotalUSD = calculateValueUSD(
    takenQuoteAmountDecimal,
    quoteInUSD,
    takenBaseAmountDecimal,
    baseInUSD,
  )
  const protocolFeesTotalUSD = calculateValueUSD(
    protocolFeesQuote,
    quoteInUSD,
    protocolFeesBase,
    baseInUSD,
  )

  book.priceRaw = priceRaw
  book.inversePrice = formatInvertedPrice(
    priceRaw,
    base.decimals,
    quote.decimals,
  )
  book.tick = tick
  book.volumeQuote = book.volumeQuote.plus(takenQuoteAmountDecimal)
  book.volumeBase = book.volumeBase.plus(takenBaseAmountDecimal)
  book.volumeUSD = book.volumeUSD.plus(amountTotalUSD)
  book.protocolFeesQuote = book.protocolFeesQuote.plus(protocolFeesQuote)
  book.protocolFeesBase = book.protocolFeesBase.plus(protocolFeesBase)
  book.protocolFeesUSD = book.protocolFeesUSD.plus(protocolFeesTotalUSD)
  book.totalValueLocked = book.totalValueLocked.minus(takenQuoteAmountDecimal)
  book.totalValueLockedUSD = book.totalValueLockedUSD.minus(amountTotalUSD)

  // depth data
  depth.unitAmount = depth.unitAmount.minus(takenUnitAmount)
  depth.quoteAmount = depth.quoteAmount.minus(takenQuoteAmount)
  depth.baseAmount = depth.baseAmount.minus(takenBaseAmount)

  // quote token data
  quote.volume = quote.volume.plus(takenQuoteAmountDecimal)
  quote.volumeUSD = quote.volumeUSD.plus(amountTotalUSD)
  quote.protocolFees = quote.protocolFees.plus(protocolFeesQuote)
  quote.protocolFeesUSD = quote.protocolFeesUSD.plus(protocolFeesTotalUSD)
  quote.totalValueLocked = quote.totalValueLocked.minus(takenQuoteAmountDecimal)
  quote.totalValueLockedUSD = quote.totalValueLockedUSD.minus(amountTotalUSD)

  // base token data
  base.volume = base.volume.plus(takenBaseAmountDecimal)
  base.volumeUSD = base.volumeUSD.plus(amountTotalUSD)
  base.protocolFees = base.protocolFees.plus(protocolFeesBase)
  base.protocolFeesUSD = base.protocolFeesUSD.plus(protocolFeesTotalUSD)
  // note: do not update base.totalValueLocked

  // interval data
  const bookDayData = updateBookDayData(book, event)
  const quoteDayData = updateTokenDayData(quote, quoteInUSD, event)
  const baseDayData = updateTokenDayData(base, baseInUSD, event)

  // update volume and protocol fees metrics
  bookDayData.volumeQuote = bookDayData.volumeQuote.plus(
    takenQuoteAmountDecimal,
  )
  bookDayData.volumeBase = bookDayData.volumeBase.plus(takenBaseAmountDecimal)
  bookDayData.volumeUSD = bookDayData.volumeUSD.plus(amountTotalUSD)
  bookDayData.protocolFeesQuote =
    bookDayData.protocolFeesQuote.plus(protocolFeesQuote)
  bookDayData.protocolFeesBase =
    bookDayData.protocolFeesBase.plus(protocolFeesBase)
  bookDayData.protocolFeesUSD =
    bookDayData.protocolFeesUSD.plus(protocolFeesTotalUSD)

  quoteDayData.volume = quoteDayData.volume.plus(takenQuoteAmountDecimal)
  quoteDayData.volumeUSD = quoteDayData.volumeUSD.plus(amountTotalUSD)
  quoteDayData.protocolFees = quoteDayData.protocolFees.plus(protocolFeesQuote)
  quoteDayData.protocolFeesUSD =
    quoteDayData.protocolFeesUSD.plus(protocolFeesTotalUSD)

  baseDayData.volume = baseDayData.volume.plus(takenBaseAmountDecimal)
  baseDayData.volumeUSD = baseDayData.volumeUSD.plus(amountTotalUSD)
  baseDayData.protocolFees = baseDayData.protocolFees.plus(protocolFeesBase)
  baseDayData.protocolFeesUSD =
    baseDayData.protocolFeesUSD.plus(protocolFeesTotalUSD)

  updateChart(
    event.block,
    takenBaseAmountDecimal,
    takenQuoteAmountDecimal,
    book,
    base,
    quote,
  )

  let currentOrderIndex = depth.latestTakenOrderIndex
  let remainingTakenUnitAmount = takenUnitAmount
  while (remainingTakenUnitAmount.gt(ZERO_BI)) {
    const orderID = encodeOrderID(book.id, tick, currentOrderIndex)
    const openOrder = OpenOrder.load(orderID.toString())
    if (openOrder === null) {
      currentOrderIndex = currentOrderIndex.plus(ONE_BI)
      continue
    }

    const openOrderRemainingUnitAmount = openOrder.unitAmount.minus(
      openOrder.filledUnitAmount,
    )
    let filledUnitAmount = ZERO_BI
    if (remainingTakenUnitAmount.lt(openOrderRemainingUnitAmount)) {
      filledUnitAmount = remainingTakenUnitAmount
    } else {
      filledUnitAmount = openOrderRemainingUnitAmount
    }

    remainingTakenUnitAmount = remainingTakenUnitAmount.minus(filledUnitAmount)

    fillOpenOrder(
      openOrder,
      book.unitSize,
      quote,
      quoteInUSD,
      base,
      baseInUSD,
      filledUnitAmount,
    )

    if (openOrder.unitAmount.equals(openOrder.filledUnitAmount)) {
      currentOrderIndex = currentOrderIndex.plus(ONE_BI)
    }
  }

  depth.latestTakenOrderIndex = currentOrderIndex
  depth.save()
  book.save()
  quote.save()
  base.save()
  bookDayData.save()
  quoteDayData.save()
  baseDayData.save()
  // openOrder.save() // already saved in fillOpenOrder
  // chartLog.save() // already saved in updateChart
  // invertedChartLog.save() // already saved in updateChart
}
