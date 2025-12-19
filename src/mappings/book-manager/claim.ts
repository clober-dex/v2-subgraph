import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
  store,
} from '@graphprotocol/graph-ts'

import { Claim } from '../../../generated/BookManager/BookManager'
import {
  decodeBookIDFromOrderID,
  getPendingUnitAmount,
} from '../../common/order'
import {
  getBookOrLog,
  getOpenOrderOrLog,
  getPoolOrLog,
  getTokenOrLog,
} from '../../common/entity-getters'
import { unitToBase, unitToQuote } from '../../common/amount'
import { tickToPrice } from '../../common/tick'
import { OpenOrder, Pool } from '../../../generated/schema'
import { TWO_BD, ZERO_BD } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { getTokenUSDPriceFlat } from '../../common/pricing'
import {
  updateBookDayData,
  updateDayData,
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
} from '../interval-updates'
import { LIQUIDITY_VAULT, OPERATOR } from '../../common/chain'

function updatePool(
  pool: Pool,
  baseClaimedAmountDecimal: BigDecimal,
  marketQuoteInUSD: BigDecimal,
  openOrder: OpenOrder,
  event: ethereum.Event,
): void {
  let spreadInUsd = pool.priceB.minus(pool.priceA).times(marketQuoteInUSD)
  if (spreadInUsd.lt(BigDecimal.zero())) {
    spreadInUsd = ZERO_BD
  }

  if (
    BigInt.fromString(pool.bookA).equals(BigInt.fromString(openOrder.book)) ||
    BigInt.fromString(pool.bookB).equals(BigInt.fromString(openOrder.book))
  ) {
    const spreadDeltaInUsd = spreadInUsd
      .div(TWO_BD)
      .times(baseClaimedAmountDecimal)
    pool.spreadProfitUSD = pool.spreadProfitUSD.plus(spreadDeltaInUsd)

    const poolHourData = updatePoolHourData(pool, event)
    const poolDayData = updatePoolDayData(pool, event)

    // update intervals
    poolHourData.spreadProfitUSD =
      poolHourData.spreadProfitUSD.plus(spreadDeltaInUsd)
    poolDayData.spreadProfitUSD =
      poolDayData.spreadProfitUSD.plus(spreadDeltaInUsd)

    pool.save()
    poolHourData.save()
    poolDayData.save()
  } else {
    log.warning('Pool {} does not contain book {}', [
      pool.id.toString(),
      openOrder.book.toString(),
    ])
  }
}

export function handleClaim(event: Claim): void {
  if (
    event.transaction.to &&
    !event.transaction.to!.equals(Address.fromString(OPERATOR))
  ) {
    updateDayData(event, 'CLAIM')
  }

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

    if (
      book.pool !== null &&
      Address.fromBytes(openOrder.owner).equals(
        Address.fromString(LIQUIDITY_VAULT),
      )
    ) {
      const pool = getPoolOrLog(book.pool!, 'CLAIM')
      const isClaimingBidBook = BigInt.fromString(pool.bookA).equals(
        BigInt.fromString(bookID),
      )
      const baseClaimedAmountDecimal = isClaimingBidBook
        ? convertTokenToDecimal(baseAmount, base.decimals)
        : convertTokenToDecimal(quoteAmount, quote.decimals)
      const marketQuoteInUSD = isClaimingBidBook ? quoteInUSD : baseInUSD
      if (pool) {
        updatePool(
          pool,
          baseClaimedAmountDecimal,
          marketQuoteInUSD,
          openOrder,
          event,
        )
      }
    }

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
