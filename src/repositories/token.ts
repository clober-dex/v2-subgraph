import { Address } from '@graphprotocol/graph-ts'

import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from '../blockchain'
import { getChainId } from '../utils'
import { Token } from '../../generated/schema'

export function loadOrCreateToken(tokenAddress: Address): Token {
  const chainId = getChainId()
  let token = Token.load(tokenAddress.toHexString())
  if (token === null) {
    token = new Token(tokenAddress.toHexString())
    token.symbol = fetchTokenSymbol(tokenAddress, chainId)
    token.name = fetchTokenName(tokenAddress, chainId)
    token.decimals = fetchTokenDecimals(tokenAddress)
  }
  token.save()
  return token
}
