import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Multicall3 } from '../generated/BookManager/Multicall3'

const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'
const ARBITRUM_SEPOLIA = BigInt.fromI32(421614)

export function getChainId(): BigInt {
  const multiCall = Multicall3.bind(Address.fromString(MULTICALL3_ADDRESS))
  return multiCall.getChainId()
}

export function getControllerAddress(): string {
  const chainId = getChainId()
  if (chainId == ARBITRUM_SEPOLIA) {
    return '0xcD79DE6Ee6644A225A87D2F40D3E3DeA8f9F7B39'
  } else {
    return '0xcD79DE6Ee6644A225A87D2F40D3E3DeA8f9F7B39'
  }
}
