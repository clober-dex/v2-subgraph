import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
export const SKIP_CHART = true
export const SKIP_TAKE_AND_SWAP = true
export const SKIP_TX_ANALYTICS = true
export const SKIP_USER_ANALYTICS = true

export const OPERATOR = '0xcd166F67F13c7d5C4B899Fb1c980Dceff278F029'
export const LIQUIDITY_VAULT = '0x21bb8709Fe339b227795809B0cb8Eb5a152Ad7E1'

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const NATIVE_TOKEN_DEFINITION: TokenDefinition = {
  address: Address.fromString('0x0000000000000000000000000000000000000000'),
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: BigInt.fromI32(18),
}

export const NATIVE_TOKEN_BOOK_ID: BigInt = BigInt.fromString(
  '5752873473294661385294815307421141216613744976882876439771', // bid book in ETH/USDC
)

export const STABLE_COINS: string[] = [
  '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // USDC
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', // USDbC
]

export const MINIMUM_USD_LOCKED = BigDecimal.fromString('0')

export const REFERENCE_TOKEN = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString('0x0000000000000000000000000000000000000000'),
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'),
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xaf88d065e77c8cc2239327c5edb3a432268e5831'),
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0xff970a61a04b1ca14834a43f5de4533ebddb5cc8'),
    symbol: 'USDC.e',
    name: 'USD Base Coin',
    decimals: BigInt.fromI32(6),
  },
]
