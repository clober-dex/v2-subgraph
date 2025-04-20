import { Address } from '@graphprotocol/graph-ts'

import { Book, OpenOrder, Token } from '../../generated/schema'
import {
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenDecimals,
} from '../blockchain'
import { getChainId } from '../utils'

export * from './snapshot'

export function mustLoadBook(bookId: string): Book {
  const book = Book.load(bookId)
  if (book === null) {
    throw new Error(`Book not found: ${bookId}`)
  }
  return book
}

export function mustLoadOpenOrder(orderId: string): OpenOrder {
  const openOrder = OpenOrder.load(orderId)
  if (openOrder === null) {
    throw new Error(`OpenOrder not found: ${orderId}`)
  }
  return openOrder
}

export function loadOrCreateToken(tokenAddress: Address): Token {
  const chainId = getChainId()
  let token = Token.load(tokenAddress.toHexString())
  if (token === null) {
    token = new Token(tokenAddress.toHexString())
    token.symbol = fetchTokenSymbol(tokenAddress, chainId)
    token.name = fetchTokenName(tokenAddress, chainId)
    token.decimals = fetchTokenDecimals(tokenAddress)
    token.save()
  }
  return token
}
