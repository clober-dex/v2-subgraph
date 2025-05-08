import { BigDecimal, log } from '@graphprotocol/graph-ts'

import { Book, Token } from '../../generated/schema'

import { ADDRESS_ZERO, ONE_BD, ZERO_BD } from './constants'
import {
  MINIMUM_USD_LOCKED,
  NATIVE_TOKEN_BOOK_ID,
  REFERENCE_TOKEN,
  STABLE_COINS,
} from './chain'

export function getTokenPrice(
  token: Token,
  visited: string[] = [],
  depth: i32 = 0,
): BigDecimal {
  const tokenId = token.id.toHexString()

  // prevent infinite loops by checking visited tokens
  if (visited.includes(tokenId)) {
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
  if (STABLE_COINS.includes(tokenId)) {
    return ONE_BD
  }

  // if it's the reference/native token, return its known price
  if (tokenId == REFERENCE_TOKEN || tokenId == ADDRESS_ZERO) {
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
      const quotePrice = getTokenPrice(
        quoteToken,
        visited.concat([tokenId]),
        depth + 1,
      )

      // calculate how much USD is locked in this book (liquidity weight)
      const usdLocked = book.totalValueLockedQuote.times(quotePrice)

      // choose the price from the book with the largest valid USD liquidity
      if (
        usdLocked.gt(MINIMUM_USD_LOCKED) &&
        usdLocked.gt(largestLiquidityUsd)
      ) {
        largestLiquidityUsd = usdLocked
        bestPrice = book.price
      }
    }
  }

  // log a warning if no valid price was found
  if (bestPrice.equals(ZERO_BD)) {
    log.warning('No price found for token {}', [tokenId])
  }

  return bestPrice
}
