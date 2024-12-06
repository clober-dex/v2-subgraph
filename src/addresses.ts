import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Multicall3 } from '../generated/BookManager/Multicall3'

const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'
const MULTICALL3_FALLBACK_ADDRESS = '0xF9cda624FBC7e059355ce98a31693d299FACd963'
export const ARBITRUM_SEPOLIA = BigInt.fromI32(421614)
export const BASE = BigInt.fromI32(8453)
export const BERA_TESTNET = BigInt.fromI32(80084)
export const ZKSYNC_ERA = BigInt.fromI32(324)
export const ZKSYNC_ERA_SEPOLIA = BigInt.fromI32(300)
export const MITOSIS_TESTNET = BigInt.fromI32(124832)

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
  if (chainId == ARBITRUM_SEPOLIA) {
    return '0xE64aCE1bF550E57461cd4e24706633d7faC9D7b0'
  } else if (chainId == BASE) {
    return '0xA694fDd88E7FEE1f5EBF878153B68ADb2ce6EbbF'
  } else if (chainId == BERA_TESTNET) {
    return '0x1A0E22870dE507c140B7C765a04fCCd429B8343F'
  } else if (chainId == MITOSIS_TESTNET) {
    return '0x6ef1c5D4cB1ebcC24d4BD7eB1b4467F26B6F2C1e'
  } else if (chainId == ZKSYNC_ERA) {
    return '0x9aF80CC61AAd734604f139A53E22c56Cdbf9a158'
  } else if (chainId == ZKSYNC_ERA_SEPOLIA) {
    return '0xA253A7c6C26E0a6E7eAbaAbCD8b1cD43A2468c48'
  } else {
    return '0xE64aCE1bF550E57461cd4e24706633d7faC9D7b0'
  }
}

export function getRebalancerAddress(): string {
  const chainId = getChainId()
  if (chainId == ARBITRUM_SEPOLIA) {
    return '0x30b4e9215322B5d0c290249126bCf96C2Ca8e948'
  } else if (chainId == BASE) {
    return '0x6A0b87D6b74F7D5C92722F6a11714DBeDa9F3895'
  } else if (chainId == BERA_TESTNET) {
    return '0x7d06c636bA86BD1fc2C38B11F1e5701145CABc30'
  } else if (chainId == MITOSIS_TESTNET) {
    return '0x6ef1c5D4cB1ebcC24d4BD7eB1b4467F26B6F2C1e'
  } else if (chainId == ZKSYNC_ERA) {
    return '0x9aF80CC61AAd734604f139A53E22c56Cdbf9a158'
  } else if (chainId == ZKSYNC_ERA_SEPOLIA) {
    return '0xA253A7c6C26E0a6E7eAbaAbCD8b1cD43A2468c48'
  } else {
    return '0x30b4e9215322B5d0c290249126bCf96C2Ca8e948'
  }
}

export function getSimpleOracleStrategyAddress(): string {
  const chainId = getChainId()
  if (chainId == ARBITRUM_SEPOLIA) {
    return '0x540488b54c8DE6e44Db7553c3A2C4ABEb09Fc69C'
  } else if (chainId == BASE) {
    return '0x9092e5f62b27c3eD78feB24A0F2ad6474D26DdA5'
  } else if (chainId == BERA_TESTNET) {
    return '0x7d06c636bA86BD1fc2C38B11F1e5701145CABc30'
  } else if (chainId == MITOSIS_TESTNET) {
    return '0x6ef1c5D4cB1ebcC24d4BD7eB1b4467F26B6F2C1e'
  } else if (chainId == ZKSYNC_ERA) {
    return '0x9aF80CC61AAd734604f139A53E22c56Cdbf9a158'
  } else if (chainId == ZKSYNC_ERA_SEPOLIA) {
    return '0xA253A7c6C26E0a6E7eAbaAbCD8b1cD43A2468c48'
  } else {
    return '0x540488b54c8DE6e44Db7553c3A2C4ABEb09Fc69C'
  }
}
