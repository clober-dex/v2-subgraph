import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Make } from '../../../generated/BookManager/BookManager'
import { Depth, OpenOrder, Pool, Token } from '../../../generated/schema'
import { unitToBase, unitToQuote } from '../../common/amount'
import {
  formatInvertedPrice,
  formatPrice,
  tickToPrice,
} from '../../common/tick'
import { BI_18, ZERO_BD, ZERO_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { calculateValueUSD, getTokenUSDPriceFlat } from '../../common/pricing'
import { encodeOrderID } from '../../common/order'
import {
  updateBookDayData,
  updateDayData,
  updateTokenDayData,
} from '../interval-updates'
import {
  getBookOrLog,
  getOrCreateTransaction,
  getPoolOrLog,
  getTokenOrLog,
} from '../../common/entity-getters'
import { LIQUIDITY_VAULT } from '../../common/chain'

function updatePoolValuation(pool: Pool, quote: Token, base: Token): void {
  const quoteUSDPrice = getTokenUSDPriceFlat(quote)
  const baseUSDPrice = getTokenUSDPriceFlat(base)
  const initialLpAmountDecimal = convertTokenToDecimal(
    pool.initialTotalSupply,
    BI_18, // assuming LP token has 18 decimals
  )
  // set initial LP price if not set
  if (
    pool.initialLPPriceUSD.equals(ZERO_BD) &&
    initialLpAmountDecimal.gt(ZERO_BD) &&
    pool.initialTokenAAmount.gt(ZERO_BI) &&
    pool.initialTokenBAmount.gt(ZERO_BI)
  ) {
    const quoteInUSD = convertTokenToDecimal(
      pool.initialTokenAAmount,
      quote.decimals,
    ).times(quoteUSDPrice)
    const baseInUSD = convertTokenToDecimal(
      pool.initialTokenBAmount,
      base.decimals,
    ).times(baseUSDPrice)
    pool.initialLPPriceUSD = quoteInUSD
      .plus(baseInUSD)
      .div(initialLpAmountDecimal)
  }

  const lpAmountDecimal = convertTokenToDecimal(
    pool.totalSupply,
    BI_18, // assuming LP token has 18 decimals
  )
  if (lpAmountDecimal.gt(ZERO_BD)) {
    const quoteInUSD = convertTokenToDecimal(
      pool.liquidityA,
      quote.decimals,
    ).times(quoteUSDPrice)
    const baseInUSD = convertTokenToDecimal(
      pool.liquidityB,
      base.decimals,
    ).times(baseUSDPrice)
    pool.lpPriceUSD = quoteInUSD.plus(baseInUSD).div(lpAmountDecimal)
    pool.totalValueLockedUSD = pool.lpPriceUSD.times(lpAmountDecimal)
  }

  pool.save()
}

export function handleMake(event: Make): void {
  updateDayData(event)

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

    const transaction = getOrCreateTransaction(event)

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

    // code from `handleUpdatePosition`
    if (
      book.pool !== null &&
      Address.fromBytes(openOrder.owner).equals(
        Address.fromString(LIQUIDITY_VAULT),
      )
    ) {
      const pool = getPoolOrLog(book.pool!, 'MAKE')
      if (pool) {
        updatePoolValuation(pool, quote, base)
      }
    }
  }
}
