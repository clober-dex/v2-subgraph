import { Address, store } from '@graphprotocol/graph-ts'

import { Cancel } from '../../../generated/BookManager/BookManager'
import {
  decodeBookIDFromOrderID,
  getPendingUnitAmount,
} from '../../common/order'
import {
  getBookOrLog,
  getDepthOrLog,
  getOpenOrderOrLog,
  getTokenOrLog,
} from '../../common/entity-getters'
import { tickToPrice } from '../../common/tick'
import { unitToBase, unitToQuote } from '../../common/amount'
import { convertTokenToDecimal } from '../../common/utils'
import { calculateValueUSD, getTokenUSDPriceFlat } from '../../common/pricing'
import {
  updateBookDayData,
  updateDayData,
  updateTokenDayData,
} from '../interval-updates'
import { OPERATOR } from '../../common/chain'

export function handleCancel(event: Cancel): void {
  if (
    event.transaction.to &&
    !event.transaction.to.equals(Address.fromString(OPERATOR))
  ) {
    updateDayData(event, 'CANCEL')
  }

  if (event.params.unit.isZero()) {
    return
  }

  const bookID = decodeBookIDFromOrderID(event.params.orderId)
  const book = getBookOrLog(bookID, 'CANCEL')
  if (book === null) {
    return
  }

  const openOrderID = event.params.orderId.toString()
  const openOrder = getOpenOrderOrLog(openOrderID, 'CANCEL')
  if (openOrder === null) {
    return
  }

  const depthID = bookID.concat('-').concat(openOrder.tick.toString())
  const depth = getDepthOrLog(depthID, 'CANCEL')
  if (depth === null) {
    return
  }

  const quote = getTokenOrLog(book.quote, 'CANCEL')
  const base = getTokenOrLog(book.base, 'CANCEL')
  if (quote && base) {
    const priceRaw = tickToPrice(openOrder.tick.toI32())

    const quoteAmount = unitToQuote(book.unitSize, event.params.unit)
    const quoteAmountDecimal = convertTokenToDecimal(
      quoteAmount,
      quote.decimals,
    )
    const quoteInUSD = getTokenUSDPriceFlat(quote)

    const baseAmount = unitToBase(book.unitSize, event.params.unit, priceRaw)
    const baseInUSD = getTokenUSDPriceFlat(base)

    // update quote data
    quote.totalValueLocked = quote.totalValueLocked.minus(quoteAmountDecimal)
    quote.totalValueLockedUSD = quote.totalValueLocked.times(quoteInUSD)

    // book data
    book.totalValueLocked = book.totalValueLocked.minus(quoteAmountDecimal)
    book.totalValueLockedUSD = book.totalValueLocked.times(quoteInUSD)

    // open order data
    openOrder.unitAmount = openOrder.unitAmount.minus(event.params.unit)
    openOrder.quoteAmount = openOrder.quoteAmount.minus(quoteAmount)
    openOrder.baseAmount = openOrder.baseAmount.minus(baseAmount)
    openOrder.amountUSD = calculateValueUSD(
      convertTokenToDecimal(openOrder.quoteAmount, quote.decimals),
      quoteInUSD,
      convertTokenToDecimal(openOrder.baseAmount, base.decimals),
      baseInUSD,
    )

    openOrder.cancelableUnitAmount = openOrder.cancelableUnitAmount.minus(
      event.params.unit,
    )
    openOrder.cancelableQuoteAmount =
      openOrder.cancelableQuoteAmount.minus(quoteAmount)
    openOrder.cancelableBaseAmount =
      openOrder.cancelableBaseAmount.minus(baseAmount)

    // depth data
    depth.unitAmount = depth.unitAmount.minus(event.params.unit)
    depth.quoteAmount = depth.quoteAmount.minus(quoteAmount)
    depth.baseAmount = depth.baseAmount.minus(baseAmount)

    updateBookDayData(book, event)
    updateTokenDayData(quote, quoteInUSD, event)

    if (getPendingUnitAmount(openOrder).isZero()) {
      store.remove('OpenOrder', openOrderID)
    } else {
      openOrder.save()
    }
    depth.save()
    book.save()
    quote.save()
  }
}
