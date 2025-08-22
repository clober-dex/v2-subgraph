import { store } from '@graphprotocol/graph-ts'

import { Claim } from '../../../generated/BookManager/BookManager'
import {
  decodeBookIDFromOrderID,
  getPendingUnitAmount,
} from '../../common/order'
import {
  getBookOrLog,
  getOpenOrderOrLog,
  getTokenOrLog,
} from '../../common/entity-getters'
import { unitToBase, unitToQuote } from '../../common/amount'
import { tickToPrice } from '../../common/tick'
import { ZERO_BD } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { getTokenUSDPriceFlat } from '../../common/pricing'
import {
  updateBookDayData,
  updateDayData,
  updateTokenDayData,
} from '../interval-updates'

export function handleClaim(event: Claim): void {
  updateDayData(event)

  if (event.params.unit.isZero()) {
    return
  }

  const bookID = decodeBookIDFromOrderID(event.params.orderId)
  const book = getBookOrLog(bookID, 'CLAIM')
  if (book === null) {
    return
  }

  const openOrderID = event.params.orderId.toString()
  const openOrder = getOpenOrderOrLog(openOrderID, 'CLAIM')
  if (openOrder === null) {
    return
  }

  const quote = getTokenOrLog(book.quote, 'CLAIM')
  const base = getTokenOrLog(book.base, 'CLAIM')
  if (quote && base) {
    const priceRaw = tickToPrice(openOrder.tick.toI32())

    const quoteAmount = unitToQuote(book.unitSize, event.params.unit)
    const baseAmount = unitToBase(book.unitSize, event.params.unit, priceRaw)

    // claimed data
    openOrder.claimedUnitAmount = openOrder.claimedUnitAmount.plus(
      event.params.unit,
    )
    openOrder.claimedBaseAmount = openOrder.claimedBaseAmount.plus(baseAmount)
    openOrder.claimedQuoteAmount =
      openOrder.claimedQuoteAmount.plus(quoteAmount)

    // claimable data
    openOrder.claimableUnitAmount = openOrder.claimableUnitAmount.minus(
      event.params.unit,
    )
    openOrder.claimableBaseAmount =
      openOrder.claimableBaseAmount.minus(baseAmount)
    openOrder.claimableQuoteAmount =
      openOrder.claimableQuoteAmount.minus(quoteAmount)

    const baseInUSD = getTokenUSDPriceFlat(base)
    const quoteInUSD = getTokenUSDPriceFlat(quote)

    if (book.makerFee.gt(ZERO_BD)) {
      // interval data
      const bookDayData = updateBookDayData(book, event)
      const quoteDayData = updateTokenDayData(quote, quoteInUSD, event)
      const baseDayData = updateTokenDayData(base, baseInUSD, event)

      if (book.isMakerFeeInQuote) {
        const protocolFeesQuote = convertTokenToDecimal(
          quoteAmount,
          quote.decimals,
        ).times(book.makerFee)
        const protocolFeesInUSD = protocolFeesQuote.times(quoteInUSD)

        book.protocolFeesQuote = book.protocolFeesQuote.plus(protocolFeesQuote)
        book.protocolFeesUSD = book.protocolFeesUSD.plus(protocolFeesInUSD)

        quote.protocolFees = quote.protocolFees.plus(protocolFeesQuote)
        quote.protocolFeesUSD = quote.protocolFeesUSD.plus(protocolFeesInUSD)

        bookDayData.protocolFeesQuote =
          bookDayData.protocolFeesQuote.plus(protocolFeesQuote)
        bookDayData.protocolFeesUSD =
          bookDayData.protocolFeesUSD.plus(protocolFeesInUSD)

        quoteDayData.protocolFees =
          quoteDayData.protocolFees.plus(protocolFeesQuote)
        quoteDayData.protocolFeesUSD =
          quoteDayData.protocolFeesUSD.plus(protocolFeesInUSD)
      } else {
        const protocolFeesBase = convertTokenToDecimal(
          baseAmount,
          base.decimals,
        ).times(book.makerFee)
        const protocolFeesInUSD = protocolFeesBase.times(baseInUSD)

        book.protocolFeesBase = book.protocolFeesBase.plus(protocolFeesBase)
        book.protocolFeesUSD = book.protocolFeesUSD.plus(protocolFeesInUSD)

        base.protocolFees = base.protocolFees.plus(protocolFeesBase)
        base.protocolFeesUSD = base.protocolFeesUSD.plus(protocolFeesInUSD)

        bookDayData.protocolFeesBase =
          bookDayData.protocolFeesBase.plus(protocolFeesBase)
        bookDayData.protocolFeesUSD =
          bookDayData.protocolFeesUSD.plus(protocolFeesInUSD)

        baseDayData.protocolFees =
          baseDayData.protocolFees.plus(protocolFeesBase)
        baseDayData.protocolFeesUSD =
          baseDayData.protocolFeesUSD.plus(protocolFeesInUSD)
      }

      // save
      book.save()
      quote.save()
      base.save()
      bookDayData.save()
      quoteDayData.save()
      baseDayData.save()
    }

    if (getPendingUnitAmount(openOrder).isZero()) {
      store.remove('OpenOrder', openOrderID)
    } else {
      openOrder.save()
    }
  }
}
