import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
export const SKIP_CHART = false
export const SKIP_TAKE_AND_SWAP = false
export const SKIP_TX_ANALYTICS = false
export const SKIP_USER_ANALYTICS = false
export const OPERATOR = '0x0000000000000000000000000000000000000000'
export const LIQUIDITY_VAULT = '0x0000000000000000000000000000000000000000'

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const NATIVE_TOKEN_DEFINITION: TokenDefinition = {
  address: Address.fromString('0x0000000000000000000000000000000000000000'),
  symbol: 'BERA',
  name: 'Berachain',
  decimals: BigInt.fromI32(18),
}

export const NATIVE_TOKEN_BOOK_ID: BigInt = BigInt.fromString(
  '4601435080485779582401876882997001715907199091434436283191', // bid book in BERA/HONEY
)

export const STABLE_COINS: string[] = [
  '0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce', // HONEY
  '0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34', // USDe
  '0x549943e04f40284185054145c6e4e9568c1d3241', // USDC.e
  '0x779ded0c9e1022225f8e0630b35a9b54be713736', // USDT0
]

export const MINIMUM_USD_LOCKED = BigDecimal.fromString('0')

export const REFERENCE_TOKEN = '0x6969696969696969696969696969696969696969'

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
