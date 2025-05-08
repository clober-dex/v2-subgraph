import { BigInt, log } from '@graphprotocol/graph-ts'

import { Make } from '../../../generated/BookManager/BookManager'
import { Book, Depth, OpenOrder, Token } from '../../../generated/schema'
import { unitToBase, unitToQuote } from '../../common/amount'
import {
  formatInvertedPrice,
  formatPrice,
  tickToPrice,
} from '../../common/tick'
import { ONE_BI, ZERO_BD, ZERO_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { getTokenPrice } from '../../common/pricing'
import { encodeOrderId } from '../../common/order'
import { loadOrCreateTransaction } from '../utils'
import { updateBookDayData, updateTokenDayData } from '../interval-updates'

export function handleMake(event: Make): void {
  const book = Book.load(event.params.bookId.toString())
  if (book === null) {
    log.error('[MAKE] Book not found: {}', [event.params.bookId.toString()])
    return
  }

  const quote = Token.load(book.quote)
  const base = Token.load(book.base)
  if (quote && base) {
    const tick = BigInt.fromI32(event.params.tick)
    const priceRaw = tickToPrice(tick.toI32())
    const orderID = encodeOrderId(book.id, tick, event.params.orderIndex)

    const quoteAmount = unitToQuote(book.unitSize, event.params.unit)
    const quoteAmountDecimal = convertTokenToDecimal(
      quoteAmount,
      quote.decimals,
    )
    const quoteInUSD = getTokenPrice(quote)

    const baseAmount = unitToBase(book.unitSize, event.params.unit, priceRaw)
    const baseAmountDecimal = convertTokenToDecimal(baseAmount, base.decimals)
    const baseInUSD = getTokenPrice(base)

    const amountUSD = quoteAmountDecimal
      .times(quoteInUSD)
      .plus(baseAmountDecimal.times(baseInUSD))

    // update quote data
    quote.txCount = quote.txCount.plus(ONE_BI)
    quote.totalValueLocked = quote.totalValueLocked.plus(quoteAmountDecimal)
    quote.totalValueLockedUSD = quote.totalValueLocked.times(quoteInUSD)

    // update base date
    base.txCount = base.txCount.plus(ONE_BI)
    base.totalValueLocked = base.totalValueLocked.plus(baseAmountDecimal)
    base.totalValueLockedUSD = base.totalValueLocked.times(baseInUSD)

    // book data
    book.orderIndex = event.params.orderIndex
    book.txCount = book.txCount.plus(ONE_BI)
    book.totalValueLockedQuote =
      book.totalValueLockedQuote.plus(quoteAmountDecimal)
    book.totalValueLockedBase =
      book.totalValueLockedBase.plus(baseAmountDecimal)
    book.totalValueLockedUSD = book.totalValueLockedUSD.plus(amountUSD)

    const transaction = loadOrCreateTransaction(event)

    // open order data
    const openOrder = new OpenOrder(orderID.toString())
    openOrder.transaction = transaction.id
    openOrder.timestamp = event.block.timestamp
    openOrder.book = book.id
    openOrder.quote = quote.id
    openOrder.base = base.id
    openOrder.origin = event.transaction.from
    openOrder.owner = event.params.user
    openOrder.priceRaw = priceRaw
    openOrder.tick = tick
    openOrder.orderIndex = event.params.orderIndex
    openOrder.price = formatPrice(priceRaw, base.decimals, quote.decimals)
    openOrder.inversePrice = formatInvertedPrice(
      priceRaw,
      base.decimals,
      quote.decimals,
    )
    // initial
    openOrder.amountUSD = amountUSD
    openOrder.unitAmount = event.params.unit
    openOrder.baseAmount = baseAmount
    openOrder.quoteAmount = quoteAmount
    // filled
    openOrder.filledAmountUSD = ZERO_BD
    openOrder.filledUnitAmount = ZERO_BI
    openOrder.filledBaseAmount = ZERO_BI
    openOrder.filledQuoteAmount = ZERO_BI
    // claimed
    openOrder.claimedAmountUSD = ZERO_BD
    openOrder.claimedUnitAmount = ZERO_BI
    openOrder.claimedBaseAmount = ZERO_BI
    openOrder.claimedQuoteAmount = ZERO_BI
    // claimable
    openOrder.claimableAmountUSD = ZERO_BD
    openOrder.claimableUnitAmount = ZERO_BI
    openOrder.claimableBaseAmount = ZERO_BI
    openOrder.claimableQuoteAmount = ZERO_BI
    // open
    openOrder.openAmountUSD = amountUSD
    openOrder.openUnitAmount = event.params.unit
    openOrder.openBaseAmount = baseAmount
    openOrder.openQuoteAmount = quoteAmount

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
      depth.price = formatPrice(priceRaw, base.decimals, quote.decimals)
      depth.inversePrice = formatInvertedPrice(
        priceRaw,
        base.decimals,
        quote.decimals,
      )
    } else {
      depth.unitAmount = depth.unitAmount.plus(event.params.unit)
      depth.baseAmount = depth.baseAmount.plus(baseAmount)
      depth.quoteAmount = depth.quoteAmount.plus(quoteAmount)
    }

    updateBookDayData(book, event)
    updateTokenDayData(quote, quoteInUSD, event)
    updateTokenDayData(base, baseInUSD, event)

    // save all
    book.save()
    quote.save()
    base.save()
    openOrder.save()
    depth.save()
  }
}
