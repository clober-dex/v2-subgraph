import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
export const SKIP_CHART = true
export const SKIP_TAKE_AND_SWAP = true
export const SKIP_TX_ANALYTICS = true
export const SKIP_USER_ANALYTICS = true

export const OPERATOR = '0x00f7a0c7e66f0e3a10d9e980e0854ebe0e308625'
export const LIQUIDITY_VAULT = '0xca1f6e4ae690d06e3bf943b9019c5ca060c0b834'

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
  '305798090575971420747066887426250327115295993737352425987', // bid book in ETH/USDC
)

export const BID_BOOK_ID: BigInt = BigInt.fromString(
  '305798090575971420747066887426250327115295993737352425987', // bid book in ETH/USDC
)

export const ASK_BOOK_ID: BigInt = BigInt.fromString(
  '195945309878431825165287262143162122266744910429476987829', // ask book in ETH/USDC
)

export const STABLE_COINS: string[] = [
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
  '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca', // USDbC
]

export const MINIMUM_USD_LOCKED = BigDecimal.fromString('0')

export const REFERENCE_TOKEN = '0x4200000000000000000000000000000000000006'

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString('0x0000000000000000000000000000000000000000'),
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x4200000000000000000000000000000000000006'),
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'),
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca'),
    symbol: 'USDbC',
    name: 'USD Base Coin',
    decimals: BigInt.fromI32(6),
  },
]
