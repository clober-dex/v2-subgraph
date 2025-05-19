import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

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
    address: Address.fromString('0x4200000000000000000000000000000000000006'),
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xa985e387ddf21b87c1fe8a0025d827674040221e'),
    symbol: 'cUSD',
    name: 'Clober USD',
    decimals: BigInt.fromI32(6),
  },
]
