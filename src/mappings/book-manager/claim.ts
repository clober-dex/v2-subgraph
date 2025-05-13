import {
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
import { Book, OpenOrder, Pool, Token } from '../../../generated/schema'
import { TWO_BD, ZERO_BD } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { calculateValueUSD, getTokenUSDPriceFlat } from '../../common/pricing'
import {
  updateDayData,
  updatePoolDayData,
  updatePoolHourData,
} from '../interval-updates'

function updatePool(
  pool: Pool,
  book: Book,
  base: Token,
  quote: Token,
  baseInUSD: BigDecimal,
  quoteInUSD: BigDecimal,
  openOrder: OpenOrder,
  claimedUnitAmount: BigInt,
  event: ethereum.Event,
): void {
  let spread = pool.priceB.minus(pool.priceA)
  if (spread.lt(BigDecimal.zero())) {
    spread = ZERO_BD
  }
  const baseClaimedAmount = unitToBase(
    book.unitSize,
    claimedUnitAmount,
    openOrder.priceRaw,
  )
  const baseClaimedAmountDecimal = convertTokenToDecimal(
    baseClaimedAmount,
    base.decimals,
  )

  const quoteClaimedAmount = unitToQuote(book.unitSize, claimedUnitAmount)
  const quoteClaimedAmountDecimal = convertTokenToDecimal(
    quoteClaimedAmount,
    quote.decimals,
  )
  const claimedAmountInUSD = calculateValueUSD(
    quoteClaimedAmountDecimal,
    quoteInUSD,
    baseClaimedAmountDecimal,
    baseInUSD,
  )

  if (
    BigInt.fromString(pool.bookA).equals(BigInt.fromString(openOrder.book)) ||
    BigInt.fromString(pool.bookB).equals(BigInt.fromString(openOrder.book))
  ) {
    const spreadDelta = spread.div(TWO_BD).times(claimedAmountInUSD)
    pool.spreadProfitUSD = pool.spreadProfitUSD.plus(spreadDelta)

    const poolHourData = updatePoolHourData(pool, event)
    const poolDayData = updatePoolDayData(pool, event)

    // update intervals
    poolHourData.spreadProfitUSD =
      poolHourData.spreadProfitUSD.plus(spreadDelta)
    poolDayData.spreadProfitUSD = poolDayData.spreadProfitUSD.plus(spreadDelta)

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

    if (book.pool !== null) {
      const pool = getPoolOrLog(book.pool!, 'CLAIM')
      if (pool) {
        const baseInUSD = getTokenUSDPriceFlat(base)
        const quoteInUSD = getTokenUSDPriceFlat(quote)
        updatePool(
          pool,
          book,
          base,
          quote,
          baseInUSD,
          quoteInUSD,
          openOrder,
          event.params.unit,
          event,
        )
      }
    }

    if (getPendingUnitAmount(openOrder).isZero()) {
      store.remove('OpenOrder', openOrderID)
    } else {
      openOrder.save()
    }
  }
}
