import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
export const SKIP_TAKE_AND_SWAP = false
export const SKIP_TX_ANALYTICS = false
export const SKIP_USER_ANALYTICS = false
export const LIQUIDITY_VAULT = '0x6d8fa3025b6d6604309ca257563cca358c0cf1aa'

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
  '2903842787083910905150096686205997338709207897290567260368',
)

export const STABLE_COINS: string[] = [
  '0x43d614b1ba4ba469faeaa4557aeafdec039b8795', // Clober USDC
  '0xf817257fed379853cde0fa4f97ab987181b1e5ea', // USDC
  '0x88b8e2161dedc77ef4ab7585569d2415a1c1055d', // USDT
]

export const MINIMUM_USD_LOCKED = BigDecimal.fromString('0')

export const REFERENCE_TOKEN = '0x760afe86e5de5fa0ee542fc7b7b713e1c5425701'

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString('0x0000000000000000000000000000000000000000'),
    symbol: 'MON',
    name: 'Monad',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x039e0ecedb4128e2ad284c8f784acc0211ee0d15'),
    symbol: 'kWMON',
    name: 'KinzaWMON',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x04a9d9d4aea93f512a4c7b71993915004325ed38'),
    symbol: 'HEDGE',
    name: 'Hedgemony',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x059a5c00045eef9aaa50ed7661224a8828858cd8'),
    symbol: 'wCLV-shMON-MON',
    name: 'Wrapped Clober Liquidity Vault shMON-MON',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x07aabd925866e8353407e67c1d157836f7ad923e'),
    symbol: 'sMON',
    name: 'StakedMonad',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x07c656794dd6bc0953e363c11ccfd3d8db306a12'),
    symbol: 'BTC-3x-250901',
    name: 'BTC 3x 2025-09-01',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x0dd6ad59ff939e59fbc9091f4bc5069a10376ebd'),
    symbol: 'EUR-20x-250901',
    name: 'EUR 20x 2025-09-01',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x0e1c9362cdea1d556e5ff89140107126baaf6b09'),
    symbol: 'aprMON',
    name: 'aprMON',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x0efed4d9fb7863ccc7bb392847c08dcd00fe9be2'),
    symbol: 'muBOND',
    name: 'muBOND',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x0f0bdebf0f83cd1ee3974779bcb7315f9808c714'),
    symbol: 'DAK',
    name: 'Molandak',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x164fd2c25e0d7c28496911f8f83649972f93a1d2'),
    symbol: 'MCA',
    name: 'Chewy',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x199c0da6f291a897302300aaae4f20d139162916'),
    symbol: 'stMON',
    name: 'Staked Monad',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x1cf0e51005971c5b78b4a8fee419832cfccd8cf9'),
    symbol: 'SolvBTC',
    name: 'Solv BTC',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x1d074e003e222905e31476a8398e36027141915b'),
    symbol: 'MON-TGE',
    name: 'Monad Pre-TGE Futures',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x1ea9099e3026e0b3f8dd6fbacaa45f30fce67431'),
    symbol: 'ATL',
    name: 'Atlantis',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x24a08695f06a37c8882cd1588442ec40061e597b'),
    symbol: 'BRK-A-250516',
    name: 'BRK-A 2025-05-16',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x295d60dcb9fd2d38e2cfe244656b4cbc3f4de583'),
    symbol: 'TSLA',
    name: 'TSLA',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x2e4fcd2ab14ea77dfde67d12489c64af92db1493'),
    symbol: 'MSFT-250401',
    name: 'Microsoft Inc. 2025-04-01',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x2e9fc807bbd818ca03947ce5327a27622112340a'),
    symbol: 'wCLV-aprMON-MON',
    name: 'Wrapped Clober Liquidity Vault aprMON-MON',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x2f8fb46539bfcdeba867ca892bdb66e4ba46c394'),
    symbol: 'GOOG-250401',
    name: 'Google Inc. 2025-04-01',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x33ee70f46a8cd6fa67bfd0b4710d05e65aaed37a'),
    symbol: 'S&P500-10x-250901',
    name: 'S&P 500 10x 2025-09-01',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x3415a9dfcf54f4b3288011ed3e1179f42b7778eb'),
    symbol: 'monWBTC',
    name: 'monWBTC',
    decimals: BigInt.fromI32(8),
  },
  {
    address: Address.fromString('0x3a98250f98dd388c211206983453837c8365bdc1'),
    symbol: 'shMON',
    name: 'ShMonad',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x3b37b6d72c8149b35f160cdd87f974dd293a094a'),
    symbol: 'RWAGMI',
    name: 'RWAGMI ',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x3f02e008e0340faa7eaca33677dafaca87dedd4b'),
    symbol: 'USDC',
    name: 'USDC',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x41df9f8a0c014a0ce398a3f2d1af3164ff0f492a'),
    symbol: 'US30Y-250516',
    name: 'US30Y 2025-05-16',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x43d614b1ba4ba469faeaa4557aeafdec039b8795'),
    symbol: 'MOCKB',
    name: 'MockB',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0x48ae1080948eaa1b7f5efeb3914b45f0c41f736d'),
    symbol: 'MON-TGE',
    name: 'Monad Pre-TGE Futures',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x4961c832469fcbb468c0a794de32faaa30ccd2f6'),
    symbol: 'suBTC',
    name: 'Sumerian BTC',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x4c632c40c2dcd39c20ee7ecdd6f9743a3c7ffe6b'),
    symbol: 'TED',
    name: 'Teeeed',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x5293596273432de9ec74b63235b0264831bb61cc'),
    symbol: 'AMZN-250401',
    name: 'Amazon Inc. 2025-04-01',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x5387c85a4965769f6b0df430638a1388493486f1'),
    symbol: 'WSOL',
    name: 'Wrapped SOL',
    decimals: BigInt.fromI32(9),
  },
  {
    address: Address.fromString('0x53e2bb2d88ddc44cc395a0cbcddc837aef44116d'),
    symbol: 'AAPL-250516',
    name: 'AAPL 2025-05-16',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x5523d21554eab9ab6164b9ceb5ff9736fea26206'),
    symbol: 'USOIL-5x-250901',
    name: 'US OIL 5x 2025-09-01',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x5d876d73f4441d5f2438b1a3e2a51771b337f27a'),
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0x5f433cfeb6cb2743481a096a56007a175e12ae23'),
    symbol: 'BTC-250516',
    name: 'BTC 2025-05-16',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x601fdf42486eb64405eff22c528c90446157c0a7'),
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x65783be7e6658d9c7c8fe2aad252bcb9a298ecff'),
    symbol: 'wCLV-sMON-MON',
    name: 'Wrapped Clober Liquidity Vault sMON-MON',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x6593f49ca8d3038ca002314c187b63dd348c2f94'),
    symbol: 'USDT',
    name: 'MockUSDT',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x6ec1c48eef35617319eda970e387f155eaeda79f'),
    symbol: 'AAPL-250401',
    name: 'Apple Inc. 2025-04-01',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x70f893f65e3c1d7f82aad72f71615eb220b74d10'),
    symbol: 'JAI',
    name: 'AI Jarvis',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0x746e48e2cdd8f6d0b672adac7810f55658dc801b'),
    symbol: 'EUR-250516',
    name: 'EUR 2025-05-16',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x760afe86e5de5fa0ee542fc7b7b713e1c5425701'),
    symbol: 'WMON',
    name: 'Wrapped Monad',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x78f2fe42776c3f84bd0fa26fdbd24ae9beb09c7d'),
    symbol: 'ETHBTC-5x-250901',
    name: 'ETHBTC 5x 2025-09-01',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x7aff20af80321c12211583e60f40c068398a53c7'),
    symbol: 'BTC',
    name: 'BTC',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x836047a99e11f376522b447bffb6e3495dd0637c'),
    symbol: 'ETH',
    name: 'ETH',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x859fb36f3fe7e22b37dd99b501f891377ddc9c33'),
    symbol: 'FIABTC',
    name: 'Fiamma BTC',
    decimals: BigInt.fromI32(8),
  },
  {
    address: Address.fromString('0x88b8e2161dedc77ef4ab7585569d2415a1c1055d'),
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0x89e4a70de5f2ae468b18b6b6300b249387f9adf0'),
    symbol: 'fMON',
    name: 'Fantasy MON',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x8ebcb3ed82b70d72f878a2a6f6fb35978f9ebb16'),
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0x8f3a8ae1f1859636e82ca4e30db9fb129b02d825'),
    symbol: 'suUSD',
    name: 'Sumerian USD',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0x93e9cae50424c7a4e3c5eceb7855b6dab74bc803'),
    symbol: 'NAP',
    name: 'Nad Poker',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xa296f47e8ff895ed7a092b4a9498bb13c46ac768'),
    symbol: 'wWETH',
    name: 'Wormhole Wrapped ETH',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xa7bff4fba9719863912d528bb294b5018542d81f'),
    symbol: 'XAU-10x-250901',
    name: 'XAU 10x 2025-09-01',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xaeef2f6b429cb59c9b2d7bb2141ada993e8571c3'),
    symbol: 'gMON',
    name: 'gMON',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xb2a6b4ed590c23d899b2661e3128b023939f546a'),
    symbol: 'kUSDC',
    name: 'KinzaUSDC',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0xb2f82d0f38dc453d596ad40a37799446cc89274a'),
    symbol: 'aprMON',
    name: 'aPriori Monad LST',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xb38bb873cca844b20a9ee448a87af3626a6e1ef5'),
    symbol: 'MIST',
    name: 'MistToken',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xb5a30b0fdc5ea94a52fdc42e3e9760cb8449fb37'),
    symbol: 'WETH',
    name: 'Wrapped ETH',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xbb444821e159dd6401bb92fb18c2ac0a37113025'),
    symbol: 'fUSD',
    name: 'Fantasy USD',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xbbf6e450f631c327746284a317bc81a4bc2134cf'),
    symbol: 'wCLV-HIVE-USDC',
    name: 'Wrapped Clober Liquidity Vault HIVE-USDC',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xc85548e0191cd34be8092b0d42eb4e45eba0d581'),
    symbol: 'NSTR',
    name: 'Nostra',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xca9a4f46faf5628466583486fd5ace8ac33ce126'),
    symbol: 'OCTO',
    name: 'OctoSwap',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xcacc9c1efd10ce2fd5a80306e4afb4892f012b9e'),
    symbol: 'wCLV-MON-USDC',
    name: 'Wrapped Clober Liquidity Vault MON-USDC',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xcaef04f305313080c2538e585089846017193033'),
    symbol: 'USOILSPOT-250516',
    name: 'USOILSPOT 2025-05-16',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xcaffd292a5c578dbd4bbff733f1553bf2cd8850c'),
    symbol: 'XAU-250516',
    name: 'XAU 2025-05-16',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xcf5a6076cfa32686c0df13abada2b40dec133f1d'),
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: BigInt.fromI32(8),
  },
  {
    address: Address.fromString('0xd4110e37768add0b83d8fed8c77691717f8161a1'),
    symbol: 'EUCLID',
    name: 'EUCLID',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0xd57e27d90e04eae2eecbc63ba28e433098f72855'),
    symbol: 'GOOGL-250516',
    name: 'GOOGL 2025-05-16',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xdb1aa7232c2ff7bb480823af254453570d0e4a16'),
    symbol: 'TSLA-250516',
    name: 'TSLA 2025-05-16',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xdbefe6a6afa590358b951d989f73824baa6e3008'),
    symbol: 'TBTC',
    name: 'Test BTC',
    decimals: BigInt.fromI32(8),
  },
  {
    address: Address.fromString('0xe0590015a873bf326bd645c3e1266d4db41c4e6b'),
    symbol: 'CHOG',
    name: 'Chog',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xe1d2439b75fb9746e7bc6cb777ae10aa7f7ef9c5'),
    symbol: 'sMON',
    name: 'Kintsu Staked Monad',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xe5eef813563dfbcc3cabc979d889f6e08d1bc6c9'),
    symbol: 'wCLV-gMON-MON',
    name: 'Wrapped Clober Liquidity Vault gMON-MON',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xe62448c986499e930a95e782885a5bbaf28ad22e'),
    symbol: 'BTC',
    name: 'BTC',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xe679feda8b57d7ba66c240d13f1fc26a38b4e01a'),
    symbol: 'BTC',
    name: 'BTC',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xe9e6cef9043a64b0284afe5993da11c1381bbc72'),
    symbol: 'BTC-250401',
    name: 'BTC 2025-04-01',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xe9f4c0093b4e94800487cad93fbbf7c3729ccf5c'),
    symbol: 'MLDK',
    name: 'MOLANDAK COIN',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xea1dd40be540228a127ddc7a36d9c37a55e439c4'),
    symbol: 'TBTC',
    name: 'TBTC',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xeb441902ac56ae1340e178fbccb3ce5890206fca'),
    symbol: 'sdrWETH',
    name: 'Sumer WETH Deposit',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xec884fe8df2dc08d6d6f2eb671351e10a14bae7c'),
    symbol: 'US30Y-30x-250901',
    name: 'US30Y 30x 2025-09-01',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xf62f63169ca4085af82c3a147475efde3edd4b50'),
    symbol: 'HIVE',
    name: 'Hive Stablecoin',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xf817257fed379853cde0fa4f97ab987181b1e5ea'),
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: BigInt.fromI32(6),
  },
  {
    address: Address.fromString('0xf8f1b89073e2a8443ae9a2b070aa353545e283c7'),
    symbol: 'S&P500-250701',
    name: 'S&P 500 2025-07-01',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xf99e8acf8740185407a67e09b51e6e574ace3f6c'),
    symbol: 'wCLV-muBOND-USDC',
    name: 'Wrapped Clober Liquidity Vault muBOND-USDC',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xfa47b094a9666422848f459b54dab88b0e8255e9'),
    symbol: 'MONKA',
    name: 'MONKA GIGA',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xfd64eb341d7811efee1e2a7e1d9a40a4e1de9487'),
    symbol: 'FROST',
    name: 'FROST',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xfe140e1dce99be9f4f15d657cd9b7bf622270c50'),
    symbol: 'YAKI',
    name: 'Moyaki',
    decimals: BigInt.fromI32(18),
  },
]
