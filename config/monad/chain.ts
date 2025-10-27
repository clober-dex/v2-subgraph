import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
export const SKIP_CHART = true
export const SKIP_TAKE_AND_SWAP = false
export const SKIP_TX_ANALYTICS = false
export const SKIP_USER_ANALYTICS = false

// TODO
export const LIQUIDITY_VAULT = '0x0000000000000000000000000000000000000000'

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const NATIVE_TOKEN_DEFINITION: TokenDefinition = {
  address: Address.fromString('0x0000000000000000000000000000000000000000'),
  symbol: 'MON',
  name: 'Monad',
  decimals: BigInt.fromI32(18),
}

export const NATIVE_TOKEN_BOOK_ID: BigInt = BigInt.fromString(
  '3875727077379471850923186002296331935053867847116966170720',
)

export const STABLE_COINS: string[] = [
  '0x754704bc059f8c67012fed69bc8a327a5aafb603', // USDC
]

export const MINIMUM_USD_LOCKED = BigDecimal.fromString('0')

export const REFERENCE_TOKEN = '0x3bd359c1119da7da1d913d1c4d2b7c461115433a'

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString('0x0000000000000000000000000000000000000000'),
    symbol: 'MON',
    name: 'Monad',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x754704bc059f8c67012fed69bc8a327a5aafb603'),
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0x3bd359c1119da7da1d913d1c4d2b7c461115433a'),
    symbol: 'WMON',
    name: 'Wrapped MON',
    decimals: BigInt.fromI32(18),
  },
]
