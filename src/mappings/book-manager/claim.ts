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
import { convertTokenToDecimal } from '../../common/utils'
import { calculateValueUSD, getTokenUSDPrice } from '../../common/pricing'

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

    // claimed data
    openOrder.claimedUnitAmount = openOrder.claimedUnitAmount.plus(
      event.params.unit,
    )
    openOrder.claimedBaseAmount = openOrder.claimedBaseAmount.plus(baseAmount)
    openOrder.claimedQuoteAmount =
      openOrder.claimedQuoteAmount.plus(quoteAmount)
    openOrder.claimedAmountUSD = openOrder.claimedAmountUSD.plus(amountUSD)

    // claimable data
    openOrder.claimableUnitAmount = openOrder.claimableUnitAmount.minus(
      event.params.unit,
    )
    openOrder.claimableBaseAmount =
      openOrder.claimableBaseAmount.minus(baseAmount)
    openOrder.claimableQuoteAmount =
      openOrder.claimableQuoteAmount.minus(quoteAmount)
    openOrder.claimableAmountUSD = openOrder.claimableAmountUSD.minus(amountUSD)

    if (getPendingUnitAmount(openOrder).isZero()) {
      store.remove('OpenOrder', openOrderID)
    } else {
      openOrder.save()
    }
  }
}
