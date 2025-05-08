import { Address, BigInt } from '@graphprotocol/graph-ts'

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
  totalSupply: BigInt
}

export const NATIVE_TOKEN_DEFINITION: TokenDefinition = {
  address: Address.fromString('0x0000000000000000000000000000000000000000'),
  symbol: 'MON',
  name: 'Monad',
  decimals: BigInt.fromI32(18),
  totalSupply: BigInt.fromString('120000000000000000000000000'),
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
