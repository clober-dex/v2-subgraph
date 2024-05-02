import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Multicall3 } from '../generated/BookManager/Multicall3'

const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'
const ARBITRUM_SEPOLIA = BigInt.fromI32(421614)
const BASE = BigInt.fromI32(8453)
const BERA_TESTNET = BigInt.fromI32(80085)

export function getChainId(): BigInt {
  const multiCall = Multicall3.bind(Address.fromString(MULTICALL3_ADDRESS))
  return multiCall.getChainId()
}

export function getControllerAddress(): string {
  // for zksync sepolia test, just return directly
  // return '0xBc3F57AB4046a5C47997e0791C2D664aA3fa0574'
  const chainId = getChainId()
  if (chainId == ARBITRUM_SEPOLIA) {
    return '0x3e15fee68C06A0Cd3aF5430A665a9dd502C8544e'
  } else if (chainId == BASE) {
    return '0x4ed2804b5409298290654D665619c7b092297dB2'
  } else if (chainId == BERA_TESTNET) {
    return '0xce3F3C90970C08Fe451998441b30879560AA6757'
  } else {
    return '0x3e15fee68C06A0Cd3aF5430A665a9dd502C8544e'
  }
}
