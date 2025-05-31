import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
export const SKIP_TAKE_AND_SWAP = false
export const SKIP_TX_ANALYTICS = false
export const SKIP_USER_ANALYTICS = false
export const LIQUIDITY_VAULT = '0x0000000000000000000000000000000000000000'

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
  '1852517060169535504988136379757974763446450312793750912689',
)

export const STABLE_COINS: string[] = [
  '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0', // Clober USDC
]

export const MINIMUM_USD_LOCKED = BigDecimal.fromString('100')

export const REFERENCE_TOKEN = '0xf2e615a933825de4b39b497f6e6991418fb31b78'

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString('0x0000000000000000000000000000000000000000'),
    symbol: 'ETH',
    name: 'Ether',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
    symbol: 'MT',
    name: 'MockERC20',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0x272516590f4bf44ec911813a7d3e86e6eb381bcc'),
    symbol: 'weETH',
    name: 'Wrapped EtherFi Ether',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x28356c7b6087eebafd1023d292ea9f5327e8f215'),
    symbol: 'weETH',
    name: 'EtherFi Wrapped eETH',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x464c8ec100f2f42fb4e42e07e203da2324f9fc67'),
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xf2e615a933825de4b39b497f6e6991418fb31b78'),
    symbol: 'MWETH',
    name: 'Mock Wrapped ETH',
    decimals: BigInt.fromI32(18),
  },
]
