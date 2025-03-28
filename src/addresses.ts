import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Multicall3 } from '../generated/BookManager/Multicall3'

const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'
const MULTICALL3_FALLBACK_ADDRESS = '0xF9cda624FBC7e059355ce98a31693d299FACd963'

export const SONIC_MAINNET = BigInt.fromI32(146)
export const BASE = BigInt.fromI32(8453)
export const MONAD_TESTNET = BigInt.fromI32(10143)
export const ARBITRUM_SEPOLIA = BigInt.fromI32(421614)
export const BERA_MAIN = BigInt.fromI32(80094)

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
  if (chainId == BASE) {
    return '0xA694fDd88E7FEE1f5EBF878153B68ADb2ce6EbbF'
  } else if (chainId == SONIC_MAINNET) {
    return '0xADc0CC0c3Ea12e57b8BcB7d7C8ac03222487E337'
  } else if (chainId == MONAD_TESTNET) {
    return '0xE64aCE1bF550E57461cd4e24706633d7faC9D7b0'
  } else if (chainId == ARBITRUM_SEPOLIA) {
    return '0xE64aCE1bF550E57461cd4e24706633d7faC9D7b0'
  } else if (chainId == BERA_MAIN) {
    return '0xA9F92548491997eE0De26A03311535A4961EE8eb'
  } else {
    throw new Error('Chain ID not supported')
  }
}

export function getRebalancerAddress(): string {
  const chainId = getChainId()
  if (chainId == BASE) {
    return '0xeA0E19fbca0D9D707f3dA10Ef846cC255B0aAdf3'
  } else if (chainId == SONIC_MAINNET) {
    return '0x46107Ec44112675689053b96aea2127fD952bd47'
  } else if (chainId == MONAD_TESTNET) {
    return '0x6d8fa3025b6d6604309Ca257563CcA358c0CF1AA'
  } else if (chainId == ARBITRUM_SEPOLIA) {
    return '0x30b4e9215322B5d0c290249126bCf96C2Ca8e948'
  } else if (chainId == BERA_MAIN) {
    return '0x0000000000000000000000000000000000000000'
  } else {
    throw new Error('Chain ID not supported')
  }
}

export function getSimpleOracleStrategyAddress(): string {
  const chainId = getChainId()
  if (chainId == BASE) {
    return '0x44E550089da3A49488794B3CB761288821B7e5E0'
  } else if (chainId == SONIC_MAINNET) {
    return '0xdd30f831bEB51fBF33E3D579e5529d3B1495554f'
  } else if (chainId == MONAD_TESTNET) {
    return '0x9eE708876804F9416B3C1a1aad0c016dee9DD804'
  } else if (chainId == ARBITRUM_SEPOLIA) {
    return '0x540488b54c8DE6e44Db7553c3A2C4ABEb09Fc69C'
  } else if (chainId == BERA_MAIN) {
    return '0x0000000000000000000000000000000000000000'
  } else {
    throw new Error('Chain ID not supported')
  }
}
