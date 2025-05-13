import { BigDecimal } from '@graphprotocol/graph-ts'

import { Book, Token } from '../../generated/schema'

import { ADDRESS_ZERO, ONE_BD, ZERO_BD } from './constants'
import {
  MINIMUM_USD_LOCKED,
  NATIVE_TOKEN_BOOK_ID,
  REFERENCE_TOKEN,
  STABLE_COINS,
} from './chain'

// @dev: too slow to use in the main loop
export function getTokenUSDPrice(
  token: Token,
  visited: string[] = [],
  depth: i32 = 0,
): BigDecimal {
  const tokenID = token.id.toHexString()

  // prevent infinite loops by checking visited tokens
  if (visited.includes(tokenID)) {
    return ZERO_BD
  }

  // limit recursion depth to avoid stack overflows
  if (depth > 3) {
    return ZERO_BD
  }

  let nativePrice = ZERO_BD
  const nativeBidBook = Book.load(NATIVE_TOKEN_BOOK_ID.toString())
  if (nativeBidBook !== null) {
    nativePrice = nativeBidBook.price
  }

  // stablecoins are always priced at 1 USD
  if (STABLE_COINS.includes(tokenID)) {
    return ONE_BD
  }

  // if it's the reference/native token, return its known price
  if (tokenID == REFERENCE_TOKEN || tokenID == ADDRESS_ZERO) {
    return nativePrice
  }

  // start searching through books where this token is the base asset
  let largestLiquidityUsd = ZERO_BD
  let bestPrice = ZERO_BD
  const books = token.books.load()

  if (books !== null) {
    for (let i = 0; i < books.length; ++i) {
      const book = books[i]
      if (book === null) {
        continue
      }

      const quoteToken = Token.load(book.quote)
      if (quoteToken === null) {
        continue
      }

      // recursively get the price of the quote token
      const quoteUSDPrice = getTokenUSDPrice(
        quoteToken,
        visited.concat([tokenID]),
        depth + 1,
      )

      // calculate how much USD is locked in this book (liquidity weight)
      const usdLocked = book.totalValueLocked.times(quoteUSDPrice)

      // choose the price from the book with the largest valid USD liquidity
      if (
        usdLocked.gt(MINIMUM_USD_LOCKED) &&
        usdLocked.gt(largestLiquidityUsd)
      ) {
        largestLiquidityUsd = usdLocked
        bestPrice = book.price.times(quoteUSDPrice)
      }
    }
  }

  // log a warning if no valid price was found
  // if (bestPrice.equals(ZERO_BD)) {
  //   log.warning('No price found for token {}', [tokenID])
  // }

  return bestPrice
}

export function getTokenUSDPriceFlat(token: Token): BigDecimal {
  const tokenID = token.id.toHexString()

  if (STABLE_COINS.includes(tokenID)) {
    return ONE_BD
  }

  if (tokenID == REFERENCE_TOKEN || tokenID == ADDRESS_ZERO) {
    const nativeBidBook = Book.load(NATIVE_TOKEN_BOOK_ID.toString())
    return nativeBidBook !== null ? nativeBidBook.price : ZERO_BD
  }

  let bestPrice = ZERO_BD
  let largestLiquidity = ZERO_BD
  const books = token.books.load()

  if (books !== null) {
    for (let i = 0; i < books.length; i++) {
      const book = books[i]
      if (book === null) {
        continue
      }

      const quoteToken = Token.load(book.quote)
      if (quoteToken === null) {
        continue
      }

      const quoteTokenID = quoteToken.id.toHexString()

      if (
        STABLE_COINS.includes(quoteTokenID) ||
        quoteTokenID == REFERENCE_TOKEN ||
        quoteTokenID == ADDRESS_ZERO
      ) {
        const quoteUSD = STABLE_COINS.includes(quoteTokenID)
          ? ONE_BD
          : ((): BigDecimal => {
              const native = Book.load(NATIVE_TOKEN_BOOK_ID.toString())
              return native !== null ? native.price : ZERO_BD
            })()

        const usdLocked = book.totalValueLocked.times(quoteUSD)

        if (
          usdLocked.gt(MINIMUM_USD_LOCKED) &&
          usdLocked.gt(largestLiquidity)
        ) {
          largestLiquidity = usdLocked
          bestPrice = book.price.times(quoteUSD)
        }
      }
    }
  }

  return bestPrice
}

export function calculateValueUSD(
  quoteAmountDecimal: BigDecimal,
  quoteInUSD: BigDecimal,
  baseAmountDecimal: BigDecimal,
  baseInUSD: BigDecimal,
): BigDecimal {
  if (quoteInUSD.gt(ZERO_BD)) {
    return quoteAmountDecimal.times(quoteInUSD)
  } else if (baseInUSD.gt(ZERO_BD)) {
    return baseAmountDecimal.times(baseInUSD)
  }
  return ZERO_BD
}
