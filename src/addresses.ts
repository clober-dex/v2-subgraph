import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Multicall3 } from '../generated/BookManager/Multicall3'

const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'
const MULTICALL3_FALLBACK_ADDRESS = '0xF9cda624FBC7e059355ce98a31693d299FACd963'
export const SONIC_MAINNET = BigInt.fromI32(146)

export function getChainId(): BigInt {
  const multiCall = Multicall3.bind(Address.fromString(MULTICALL3_ADDRESS))
  const chainId = multiCall.try_getChainId()
  if (chainId.reverted) {
    const multiCallFallback = Multicall3.bind(
      Address.fromString(MULTICALL3_FALLBACK_ADDRESS),
    )
    const chainIdFallback = multiCallFallback.try_getChainId()
    if (chainIdFallback.reverted) {
      return BigInt.fromI32(0)
    } else {
      return chainIdFallback.value
    }
  }
  return chainId.value
}

export function getControllerAddress(): string {
  const chainId = getChainId()
  if (chainId == SONIC_MAINNET) {
    return '0xADc0CC0c3Ea12e57b8BcB7d7C8ac03222487E337'
  } else {
    throw new Error('Chain ID not supported')
  }
}

export function getRebalancerAddress(): string {
  const chainId = getChainId()
  if (chainId == SONIC_MAINNET) {
    return '0xADc0CC0c3Ea12e57b8BcB7d7C8ac03222487E337'
  } else {
    throw new Error('Chain ID not supported')
  }
}

export function getSimpleOracleStrategyAddress(): string {
  const chainId = getChainId()
  if (chainId == SONIC_MAINNET) {
    throw new Error('Chain ID not supported')
  } else {
    return '0x540488b54c8DE6e44Db7553c3A2C4ABEb09Fc69C'
  }
}
