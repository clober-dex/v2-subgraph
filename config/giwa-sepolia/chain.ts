import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
export const SKIP_TAKE_AND_SWAP = true
export const SKIP_TX_ANALYTICS = true
export const SKIP_USER_ANALYTICS = true
export const LIQUIDITY_VAULT = '0x9c6c405cbb2c1dc7aaaa65156744fc00efc7ec82'

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
  '4953321616274687965290942259176347387668931724392780179128',
)

export const STABLE_COINS: string[] = [
  '0x5c91a02b8b5d10597fc6ca23faf56f9718d1fed0', // GIWA USDC
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
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x5c91a02b8b5d10597fc6ca23faf56f9718d1fed0'),
    name: 'GiwaDex USD',
    symbol: 'GUSD',
    decimals: BigInt.fromI32(6),
  },
]
