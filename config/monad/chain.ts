import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
export const SKIP_CHART = true
export const SKIP_TAKE_AND_SWAP = false
export const SKIP_TX_ANALYTICS = false
export const SKIP_USER_ANALYTICS = false

export const LIQUIDITY_VAULT = '0xb09684f5486d1af80699bbc27f14dd5a905da873'

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
  '5954885684956363054050231031211743946744177791604395877538',
)

export const STABLE_COINS: string[] = [
  '0x754704bc059f8c67012fed69bc8a327a5aafb603', // USDC
  '0xe7cd86e13ac4309349f30b3435a9d337750fc82d', // USDT
  '0x00000000efe302beaa2b3e6e1b18d08d69a9012a', // AUSD
  '0x111111d2bf19e43c34263401e0cad979ed1cdb61', // USD1
]

export const MINIMUM_USD_LOCKED = BigDecimal.fromString('100')

export const REFERENCE_TOKEN = '0x3bd359c1119da7da1d913d1c4d2b7c461115433a'

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString('0x0000000000000000000000000000000000000000'),
    symbol: 'MON',
    name: 'Monad',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x00000000efe302beaa2b3e6e1b18d08d69a9012a'),
    symbol: 'AUSD',
    name: 'AUSD',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0x01bff41798a0bcf287b996046ca68b395dbc1071'),
    symbol: 'XAUt0',
    name: 'XAUt0',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0x04f8c38ae80bcf690b947f60f62bda18145c3d67'),
    symbol: 'MVT',
    name: 'Monad Vault',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x0555e30da8f98308edb960aa94c0db47230d2b9c'),
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: BigInt.fromI32(8),
  },
  {
    address: Address.fromString('0x10aeaf63194db8d453d4d85a06e5efe1dd0b5417'),
    symbol: 'wstETH',
    name: 'Wrapped liquid staked Ether 2.0',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x1b68626dca36c7fe922fd2d55e4f631d962de19c'),
    symbol: 'shMON',
    name: 'ShMonad',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x1d4795a4670033f47f572b910553be0295077b51'),
    symbol: 'mcMON',
    name: 'mcMON',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x37d6382b6889ccef8d6871a8b60e667115eddbcf'),
    symbol: 'pufETH',
    name: 'pufETH',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x3bd359c1119da7da1d913d1c4d2b7c461115433a'),
    symbol: 'WMON',
    name: 'Wrapped MON',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x405b6330e213ded490240cbcdd64790806827777'),
    symbol: 'moncock',
    name: 'moncock',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x4917a5ec9fcb5e10f47cbb197abe6ab63be81fe8'),
    symbol: 'AZND',
    name: 'Asian Dollar',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x512d423a83cd283f23bd1499fcd5cdaa0bd62b07'),
    symbol: 'GONAD',
    name: 'GONAD',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x754704bc059f8c67012fed69bc8a327a5aafb603'),
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0x788571e0e5067adea87e6ba22a2b738ffdf48888'),
    symbol: 'UNIT',
    name: 'UNIT',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x7db552eeb6b77a6babe6e0a739b5382cd653cc3e'),
    symbol: 'GMONAD',
    name: 'GMONAD',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x8498312a6b3cbd158bf0c93abdcf29e6e4f55081'),
    symbol: 'gMON',
    name: 'gMON',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xb0f70c0bd6fd87dbeb7c10dc692a2a6106817072'),
    symbol: 'BTC.b',
    name: 'Bitcoin',
    decimals: BigInt.fromI32(8),
  },
  {
    address: Address.fromString('0xe7cd86e13ac4309349f30b3435a9d337750fc82d'),
    symbol: 'USDT0',
    name: 'USDT0',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0xe85411c030fb32a9d8b14bbbc6cb19417391f711'),
    symbol: 'suBTC',
    name: 'Sumerian BTC',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xea17e5a9efebf1477db45082d67010e2245217f1'),
    symbol: 'SOL',
    name: 'Wrapped SOL',
    decimals: BigInt.fromI32(9),
  },
  {
    address: Address.fromString('0xecac9c5f704e954931349da37f60e39f515c11c1'),
    symbol: 'LBTC',
    name: 'Lombard Staked Bitcoin',
    decimals: BigInt.fromI32(8),
  },
  {
    address: Address.fromString('0xee8c0e9f1bffb4eb878d8f15f368a02a35481242'),
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xff7f8f301f7a706e3cfd3d2275f5dc0b9ee8009b'),
    symbol: 'FOLKS',
    name: 'Folks Finance',
    decimals: BigInt.fromI32(6),
  },
]
