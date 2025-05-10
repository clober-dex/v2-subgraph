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

export function handleClaim(event: Claim): void {
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

    if (getPendingUnitAmount(openOrder).isZero()) {
      store.remove('OpenOrder', openOrderID)
    } else {
      openOrder.save()
    }
  }
}
