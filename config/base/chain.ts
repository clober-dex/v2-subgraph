import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
export const SKIP_CHART = true
export const SKIP_TAKE_AND_SWAP = true
export const SKIP_TX_ANALYTICS = true
export const SKIP_USER_ANALYTICS = true

export const OPERATOR = '0x7ba560d09bd5379216f1e4393906701210cb63fb'
export const LIQUIDITY_VAULT = '0x5b351c9eed322616f76b8669176412e1808c06b5'

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
