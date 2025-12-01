import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Make } from '../../../generated/BookManager/BookManager'
import { Depth, OpenOrder } from '../../../generated/schema'
import { unitToBase, unitToQuote } from '../../common/amount'
import {
  formatInvertedPrice,
  formatPrice,
  tickToPrice,
} from '../../common/tick'
import { ZERO_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { calculateValueUSD, getTokenUSDPriceFlat } from '../../common/pricing'
import { encodeOrderID } from '../../common/order'
import {
  updateBookDayData,
  updateDayData,
  updateTokenDayData,
} from '../interval-updates'
import { getBookOrLog, getTokenOrLog } from '../../common/entity-getters'
import { OPERATOR } from '../../common/chain'

export function handleMake(event: Make): void {
  if (
    event.transaction.to &&
    !event.transaction.to.equals(Address.fromString(OPERATOR))
  ) {
    updateDayData(event, 'MAKE')
  }

  const book = getBookOrLog(event.params.bookId.toString(), 'MAKE')
  if (book === null) {
    return
  }

  const quote = getTokenOrLog(book.quote, 'MAKE')
  const base = getTokenOrLog(book.base, 'MAKE')
  if (quote && base) {
    const tick = BigInt.fromI32(event.params.tick)
    const priceRaw = tickToPrice(tick.toI32())
    const orderID = encodeOrderID(book.id, tick, event.params.orderIndex)

    const quoteAmount = unitToQuote(book.unitSize, event.params.unit)
    const quoteAmountDecimal = convertTokenToDecimal(
      quoteAmount,
      quote.decimals,
    )
    const quoteInUSD = getTokenUSDPriceFlat(quote)

    const baseAmount = unitToBase(book.unitSize, event.params.unit, priceRaw)
    const baseAmountDecimal = convertTokenToDecimal(baseAmount, base.decimals)
    const baseInUSD = getTokenUSDPriceFlat(base)

    const amountUSD = calculateValueUSD(
      quoteAmountDecimal,
      quoteInUSD,
      baseAmountDecimal,
      baseInUSD,
    )

    // update quote data
    quote.totalValueLocked = quote.totalValueLocked.plus(quoteAmountDecimal)
    quote.totalValueLockedUSD = quote.totalValueLocked.times(quoteInUSD)

    // book data
    book.totalValueLocked = book.totalValueLocked.plus(quoteAmountDecimal)
    book.totalValueLockedUSD = book.totalValueLocked.times(quoteInUSD)

    // open order data
    const openOrder = new OpenOrder(orderID.toString())
    openOrder.timestamp = event.block.timestamp
    openOrder.book = book.id
    openOrder.quote = quote.id
    openOrder.base = base.id
    openOrder.origin = event.transaction.from
    openOrder.owner = event.params.user
    openOrder.priceRaw = priceRaw
    openOrder.tick = tick
    openOrder.orderIndex = event.params.orderIndex
    openOrder.price = formatPrice(priceRaw, base.decimals, quote.decimals) // checked
    openOrder.inversePrice = formatInvertedPrice(
      priceRaw,
      base.decimals,
      quote.decimals,
    ) // checked
    // initial
    openOrder.amountUSD = amountUSD
    openOrder.unitAmount = event.params.unit
    openOrder.baseAmount = baseAmount
    openOrder.quoteAmount = quoteAmount
    // filled
    openOrder.filledUnitAmount = ZERO_BI
    openOrder.filledBaseAmount = ZERO_BI
    openOrder.filledQuoteAmount = ZERO_BI
    // claimed
    openOrder.claimedUnitAmount = ZERO_BI
    openOrder.claimedBaseAmount = ZERO_BI
    openOrder.claimedQuoteAmount = ZERO_BI
    // claimable
    openOrder.claimableUnitAmount = ZERO_BI
    openOrder.claimableBaseAmount = ZERO_BI
    openOrder.claimableQuoteAmount = ZERO_BI
    // open
    openOrder.cancelableUnitAmount = event.params.unit
    openOrder.cancelableBaseAmount = baseAmount
    openOrder.cancelableQuoteAmount = quoteAmount

    // depth data
    const depthID = book.id.toString().concat('-').concat(tick.toString())
    let depth = Depth.load(depthID)
    if (depth === null) {
      depth = new Depth(depthID)
      depth.book = book.id
      depth.tick = tick
      depth.latestTakenOrderIndex = ZERO_BI
      depth.unitAmount = event.params.unit
      depth.baseAmount = baseAmount
      depth.quoteAmount = quoteAmount
      depth.priceRaw = priceRaw
      depth.price = formatPrice(priceRaw, base.decimals, quote.decimals) // checked
      depth.inversePrice = formatInvertedPrice(
        priceRaw,
        base.decimals,
        quote.decimals,
      ) // checked
    } else {
      depth.unitAmount = depth.unitAmount.plus(event.params.unit)
      depth.baseAmount = depth.baseAmount.plus(baseAmount)
      depth.quoteAmount = depth.quoteAmount.plus(quoteAmount)
    }

    updateBookDayData(book, event)
    updateTokenDayData(quote, quoteInUSD, event)

    // save all
    book.save()
    quote.save()
    openOrder.save()
    depth.save()
  }
}
