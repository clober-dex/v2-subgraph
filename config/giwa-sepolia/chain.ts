import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
export const SKIP_TAKE_AND_SWAP = true
export const SKIP_TX_ANALYTICS = true
export const SKIP_USER_ANALYTICS = true
export const LIQUIDITY_VAULT = '0xb735FdD82497Dd9AbfEEAdc659b960473BF896E0'

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
  '0x0Cd2C356be90864F4a5e0551E79dd039b246FaCA', // USDG
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
    address: Address.fromString('0x0Cd2C356be90864F4a5e0551E79dd039b246FaCA'),
    name: 'GiwaDex USD',
    symbol: 'USDG',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0xD031A3C56eD35EFE5F7e5269B088F8C3a2c9d463'),
    name: 'GiwaDex KRW',
    symbol: 'KRWG',
    decimals: BigInt.fromI32(6),
  },
]
