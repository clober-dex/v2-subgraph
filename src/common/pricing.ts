import { BigDecimal } from '@graphprotocol/graph-ts'

import { Book, Token } from '../../generated/schema'

import { ADDRESS_ZERO, ONE_BD, ZERO_BD } from './constants'
import {
  MINIMUM_USD_LOCKED,
  NATIVE_TOKEN_BOOK_ID,
  REFERENCE_TOKEN,
  STABLE_COINS,
} from './chain'

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
          usdLocked.gt(largestLiquidity) &&
          book.price.times(quoteUSD).gt(ZERO_BD)
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
