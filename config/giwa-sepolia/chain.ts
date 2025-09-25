import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
export const SKIP_TAKE_AND_SWAP = true
export const SKIP_TX_ANALYTICS = true
export const SKIP_USER_ANALYTICS = true
export const LIQUIDITY_VAULT = '0xb735fdd82497dd9abfeeadc659b960473bf896e0'

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
  '188609889676779107296838050732856164493654931176329827921',
)

export const STABLE_COINS: string[] = [
  '0x0cd2c356be90864f4a5e0551e79dd039b246faca', // USDG
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
    address: Address.fromString('0x0cd2c356be90864f4a5e0551e79dd039b246faca'),
    name: 'GiwaDex USD',
    symbol: 'USDG',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0xd031a3c56ed35efe5f7e5269b088f8c3a2c9d463'),
    name: 'GiwaDex KRW',
    symbol: 'KRWG',
    decimals: BigInt.fromI32(6),
  },
]
