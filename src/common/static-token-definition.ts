import { Address } from '@graphprotocol/graph-ts'

import {
  NATIVE_TOKEN_DEFINITION,
  STATIC_TOKEN_DEFINITIONS,
  TokenDefinition,
} from './chain'
import { ADDRESS_ZERO } from './constants'

// Helper for hardcoded tokens
export const getStaticDefinition = (
  tokenAddress: Address,
): TokenDefinition | null => {
  const staticDefinitions = STATIC_TOKEN_DEFINITIONS
  const tokenAddressHex = tokenAddress.toHexString()
  if (tokenAddressHex == ADDRESS_ZERO) {
    return NATIVE_TOKEN_DEFINITION
  }

  // Search the definition using the address
  for (let i = 0; i < staticDefinitions.length; i++) {
    const staticDefinition = staticDefinitions[i]
    if (
      staticDefinition.address.toHexString().toLowerCase() ==
      tokenAddressHex.toLowerCase()
    ) {
      return staticDefinition
    }
  }

  // If not found, return null
  return null
}
