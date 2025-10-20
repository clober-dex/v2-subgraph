import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from '@graphprotocol/graph-ts'

import { Take } from '../../../generated/BookManager/BookManager'
import {
  Book,
  ChartLog,
  OpenOrder,
  Pool,
  Take as TakeEntity,
  Token,
} from '../../../generated/schema'
import { unitToBase, unitToQuote } from '../../common/amount'
import { encodeOrderID } from '../../common/order'
import { ONE_BI, ZERO_BD, ZERO_BI } from '../../common/constants'
import {
  getBookOrLog,
  getDepthOrLog,
  getPoolOrLog,
  getTokenOrLog,
} from '../../common/entity-getters'
import { convertTokenToDecimal } from '../../common/utils'
import { calculateValueUSD, getTokenUSDPriceFlat } from '../../common/pricing'
import {
  formatInvertedPrice,
  formatPrice,
  tickToPrice,
} from '../../common/tick'
import {
  updateBookDayData,
  updateDayData,
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
  updateUserDayVolume,
  updateUserNativeVolume,
} from '../interval-updates'
import {
  CHART_LOG_INTERVALS,
  encodeChartLogID,
  encodeMarketCode,
} from '../../common/chart'
import {
  LIQUIDITY_VAULT,
  SKIP_CHART,
  SKIP_TAKE_AND_SWAP,
} from '../../common/chain'

function fillOpenOrder(
  openOrder: OpenOrder,
  unitSize: BigInt,
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

  const claimableUnitAfterFill =
    openOrder.claimableUnitAmount.plus(filledUnitAmount)
  openOrder.claimableUnitAmount = claimableUnitAfterFill
  openOrder.claimableBaseAmount = unitToBase(
    unitSize,
    claimableUnitAfterFill,
    openOrder.priceRaw,
  )
  openOrder.claimableQuoteAmount = unitToQuote(unitSize, claimableUnitAfterFill)

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
      chartLog.base = base.id
      chartLog.quote = quote.id
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
      invertedChartLog.base = quote.id
      invertedChartLog.quote = base.id
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

function updatePool(
  pool: Pool,
  book: Book,
  base: Token,
  quote: Token,
  baseInUSD: BigDecimal,
  quoteInUSD: BigDecimal,
  filledUnitAmount: BigInt,
  priceRaw: BigInt,
  event: ethereum.Event,
): void {
  const filledBaseAmount = unitToBase(book.unitSize, filledUnitAmount, priceRaw)
  const filledBaseAmountDecimal = convertTokenToDecimal(
    filledBaseAmount,
    base.decimals,
  )
  const filledQuoteAmount = unitToQuote(book.unitSize, filledUnitAmount)
  const filledQuoteAmountDecimal = convertTokenToDecimal(
    filledQuoteAmount,
    quote.decimals,
  )
  const filledUSDAmount = calculateValueUSD(
    filledQuoteAmountDecimal,
    quoteInUSD,
    filledBaseAmountDecimal,
    baseInUSD,
  )

  const poolHourData = updatePoolHourData(pool, event)
  const poolDayData = updatePoolDayData(pool, event)

  if (Address.fromBytes(pool.tokenA).equals(Address.fromBytes(book.base))) {
    // ask book
    pool.liquidityA = pool.liquidityA.plus(filledBaseAmount)
    pool.liquidityB = pool.liquidityB.minus(filledQuoteAmount)

    pool.volumeTokenA = pool.volumeTokenA.plus(filledBaseAmountDecimal)
    pool.volumeTokenB = pool.volumeTokenB.plus(filledQuoteAmountDecimal)
    pool.volumeUSD = pool.volumeUSD.plus(filledUSDAmount)

    // update interval data
    poolHourData.volumeTokenA = poolHourData.volumeTokenA.plus(
      filledBaseAmountDecimal,
    )
    poolHourData.volumeTokenB = poolHourData.volumeTokenB.plus(
      filledQuoteAmountDecimal,
    )
    poolHourData.volumeUSD = poolHourData.volumeUSD.plus(filledUSDAmount)
    poolDayData.volumeTokenA = poolDayData.volumeTokenA.plus(
      filledBaseAmountDecimal,
    )
    poolDayData.volumeTokenB = poolDayData.volumeTokenB.plus(
      filledQuoteAmountDecimal,
    )
    poolDayData.volumeUSD = poolDayData.volumeUSD.plus(filledUSDAmount)
  } else if (
    Address.fromBytes(pool.tokenB).equals(Address.fromBytes(book.base))
  ) {
    // bid book
    pool.liquidityA = pool.liquidityA.minus(filledQuoteAmount)
    pool.liquidityB = pool.liquidityB.plus(filledBaseAmount)

    pool.volumeTokenA = pool.volumeTokenA.plus(filledQuoteAmountDecimal)
    pool.volumeTokenB = pool.volumeTokenB.plus(filledBaseAmountDecimal)
    pool.volumeUSD = pool.volumeUSD.plus(filledUSDAmount)

    // update interval data
    poolHourData.volumeTokenA = poolHourData.volumeTokenA.plus(
      filledQuoteAmountDecimal,
    )
    poolHourData.volumeTokenB = poolHourData.volumeTokenB.plus(
      filledBaseAmountDecimal,
    )
    poolHourData.volumeUSD = poolHourData.volumeUSD.plus(filledUSDAmount)
    poolDayData.volumeTokenA = poolDayData.volumeTokenA.plus(
      filledQuoteAmountDecimal,
    )
    poolDayData.volumeTokenB = poolDayData.volumeTokenB.plus(
      filledBaseAmountDecimal,
    )
    poolDayData.volumeUSD = poolDayData.volumeUSD.plus(filledUSDAmount)
  } else {
    log.error('[TAKE] Pool token mismatch: {} {} vs {} {}', [
      pool.tokenA.toHexString(),
      pool.tokenB.toHexString(),
      book.base.toHexString(),
      book.quote.toHexString(),
    ])
  }

  pool.save()
  poolHourData.save()
  poolDayData.save()
}

export function handleTake(event: Take): void {
  updateDayData(event)

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
  book.price = formatPrice(priceRaw, base.decimals, quote.decimals) // this should be first, checked

  const quoteInUSD = getTokenUSDPriceFlat(quote)
  const baseInUSD = getTokenUSDPriceFlat(base)
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
  book.totalValueLockedUSD = book.totalValueLocked.times(quoteInUSD)
  book.lastTakenTimestamp = event.block.timestamp
  book.lastTakenBlockNumber = event.block.number

  // depth data
  depth.unitAmount = depth.unitAmount.minus(takenUnitAmount)
  depth.quoteAmount = depth.quoteAmount.minus(takenQuoteAmount)
  depth.baseAmount = depth.baseAmount.minus(takenBaseAmount)

  // quote token data
  quote.priceUSD = quoteInUSD
  quote.volume = quote.volume.plus(takenQuoteAmountDecimal)
  quote.volumeUSD = quote.volumeUSD.plus(amountTotalUSD)
  quote.protocolFees = quote.protocolFees.plus(protocolFeesQuote)
  quote.protocolFeesUSD = quote.protocolFeesUSD.plus(protocolFeesTotalUSD)
  quote.totalValueLocked = quote.totalValueLocked.minus(takenQuoteAmountDecimal)
  quote.totalValueLockedUSD = quote.totalValueLocked.times(quoteInUSD)

  // base token data
  base.priceUSD = baseInUSD
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

  if (!SKIP_CHART) {
    updateChart(
      event.block,
      takenBaseAmountDecimal,
      takenQuoteAmountDecimal,
      book,
      base,
      quote,
    )
  }

  const take = new TakeEntity(
    event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.logIndex.toString()),
  )
  take.transaction = event.transaction.hash.toHexString()
  take.timestamp = event.block.timestamp
  take.inputToken = book.base
  take.outputToken = book.quote
  take.book = book.id
  take.origin = event.transaction.from
  take.inputAmount = takenBaseAmount
  take.outputAmount = takenQuoteAmount
  take.amountUSD = amountTotalUSD
  take.logIndex = event.logIndex
  if (!SKIP_TAKE_AND_SWAP) {
    take.save()
  }

  let currentOrderIndex = depth.latestTakenOrderIndex
  let remainingTakenUnitAmount = takenUnitAmount
  while (remainingTakenUnitAmount.gt(ZERO_BI)) {
    const orderID = encodeOrderID(book.id, tick, currentOrderIndex)
    const openOrder = OpenOrder.load(orderID.toString())
    if (openOrder === null) {
      currentOrderIndex = currentOrderIndex.plus(ONE_BI)
      // mathematically, continue is correct,
      // but due to an issue on a specific testnet where events are duplicated or missing,
      // it could cause an infinite loop, so changed to break
      break
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

    fillOpenOrder(openOrder, book.unitSize, filledUnitAmount)

    if (
      book.pool !== null &&
      Address.fromBytes(openOrder.owner).equals(
        Address.fromString(LIQUIDITY_VAULT),
      )
    ) {
      const pool = getPoolOrLog(book.pool!, 'TAKE')
      if (pool) {
        updatePool(
          pool,
          book,
          base,
          quote,
          baseInUSD,
          quoteInUSD,
          filledUnitAmount,
          priceRaw,
          event,
        )
      }
    }

    if (openOrder.unitAmount.equals(openOrder.filledUnitAmount)) {
      currentOrderIndex = currentOrderIndex.plus(ONE_BI)
    }
  }

  if (quoteInUSD.gt(ZERO_BD)) {
    updateUserDayVolume(quote, event, takenQuoteAmountDecimal, amountTotalUSD)
  } else if (baseInUSD.gt(ZERO_BD)) {
    updateUserDayVolume(base, event, takenBaseAmountDecimal, amountTotalUSD)
  }
  updateUserNativeVolume(
    event,
    take.inputToken,
    take.outputToken,
    take.inputAmount,
    take.outputAmount,
  )
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
