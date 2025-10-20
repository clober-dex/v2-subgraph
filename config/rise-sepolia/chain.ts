import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
export const SKIP_CHART = false
export const SKIP_TAKE_AND_SWAP = true
export const SKIP_TX_ANALYTICS = true
export const SKIP_USER_ANALYTICS = true
export const LIQUIDITY_VAULT = '0x552e53700042e0446c896b1803d9399ba846cf83'

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
  '3309505254691089382449743837966370163917130126854954614757',
)

export const STABLE_COINS: string[] = [
  '0xa985e387ddf21b87c1fe8a0025d827674040221e', // Clober USDC
  '0x40918ba7f132e0acba2ce4de4c4baf9bd2d7d849', // USDT
  '0x8a93d247134d91e0de6f96547cb0204e5be8e5d8', // USDC
]

export const MINIMUM_USD_LOCKED = BigDecimal.fromString('0')

export const REFERENCE_TOKEN = '0x4200000000000000000000000000000000000006'

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString('0x0000000000000000000000000000000000000000'),
    symbol: 'ETH',
    name: 'Ether',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x40918ba7f132e0acba2ce4de4c4baf9bd2d7d849'),
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: BigInt.fromI32(8),
  },
  {
    address: Address.fromString('0x4200000000000000000000000000000000000006'),
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x6f6f570f45833e249e27022648a26f4076f48f78'),
    name: 'Pepe',
    symbol: 'PEPE',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x8a93d247134d91e0de6f96547cb0204e5be8e5d8'),
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0x99dbe4aea58e518c50a1c04ae9b48c9f6354612f'),
    name: 'Mog Coin',
    symbol: 'MOG',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xa985e387ddf21b87c1fe8a0025d827674040221e'),
    name: 'Clober USD',
    symbol: 'cUSD',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0xd6e1afe5ca8d00a2efc01b89997abe2de47fdfaf'),
    name: 'RISE',
    symbol: 'RISE',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xf32d39ff9f6aa7a7a64d7a4f00a54826ef791a55'),
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    decimals: BigInt.fromI32(18),
  },
]
