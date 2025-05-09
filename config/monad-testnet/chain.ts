import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

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

export const MINIMUM_USD_LOCKED = BigDecimal.fromString('100')

export const REFERENCE_TOKEN = '0x760afe86e5de5fa0ee542fc7b7b713e1c5425701'

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
