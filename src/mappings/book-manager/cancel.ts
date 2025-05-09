import { store } from '@graphprotocol/graph-ts'

import { Cancel } from '../../../generated/BookManager/BookManager'
import {
  decodeBookIdFromOrderId,
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
import { calculateValueUSD, getTokenUSDPrice } from '../../common/pricing'
import { ONE_BI } from '../../common/constants'
import { updateBookDayData, updateTokenDayData } from '../interval-updates'

export function handleCancel(event: Cancel): void {
  if (event.params.unit.isZero()) {
    return
  }

  const bookID = decodeBookIdFromOrderId(event.params.orderId)
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
    const quoteInUSD = getTokenUSDPrice(quote)

    const baseAmount = unitToBase(book.unitSize, event.params.unit, priceRaw)
    const baseAmountDecimal = convertTokenToDecimal(baseAmount, base.decimals)
    const baseInUSD = getTokenUSDPrice(base)

    const amountUSD = calculateValueUSD(
      quoteAmountDecimal,
      quoteInUSD,
      baseAmountDecimal,
      baseInUSD,
    )

    // update quote data
    quote.totalValueLocked = quote.totalValueLocked.minus(quoteAmountDecimal)
    quote.totalValueLockedUSD = quote.totalValueLocked.times(quoteInUSD)

    // book data
    book.totalValueLocked = book.totalValueLocked.minus(quoteAmountDecimal)
    book.totalValueLockedUSD = book.totalValueLockedUSD.minus(amountUSD)

    // open order data
    openOrder.openUnitAmount = openOrder.openUnitAmount.minus(event.params.unit)
    openOrder.openQuoteAmount = openOrder.openQuoteAmount.minus(quoteAmount)
    openOrder.openBaseAmount = openOrder.openBaseAmount.minus(baseAmount)
    openOrder.openAmountUSD = openOrder.openAmountUSD.minus(amountUSD)

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
    if (depth.unitAmount.isZero()) {
      store.remove('Depth', depthID)
    } else {
      depth.save()
    }
    book.save()
    quote.save()
  }
}
