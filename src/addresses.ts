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
  // return '0x6d29603bFd8989B7A8F4E8751d34afC4fDa4e001'
  // for zksync, just return directly
  // return '0x46D949cb444feF1a1BF63767F513f5091de6b5f5'
  const chainId = getChainId()
  if (chainId == ARBITRUM_SEPOLIA) {
    return '0x91101543D3Bd3e919dAd034Bf978ef9d87290993'
  } else if (chainId == BASE) {
    return '0xA694fDd88E7FEE1f5EBF878153B68ADb2ce6EbbF'
  } else if (chainId == BERA_TESTNET) {
    return '0x1Aa68597c14F3f950E2683fA7a975fc9CdAcC484'
  } else {
    return '0x91101543D3Bd3e919dAd034Bf978ef9d87290993'
  }
}
