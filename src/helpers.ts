import { Address, BigDecimal, BigInt, TypedMap } from '@graphprotocol/graph-ts'

import { ERC20 } from '../generated/BookManager/ERC20'
import { ERC20SymbolBytes } from '../generated/BookManager/ERC20SymbolBytes'
import { ERC20NameBytes } from '../generated/BookManager/ERC20NameBytes'
import { Book, Token } from '../generated/schema'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export const CHART_LOG_INTERVALS = new TypedMap<string, number>()
CHART_LOG_INTERVALS.set('1m', 60)
CHART_LOG_INTERVALS.set('3m', 3 * 60)
CHART_LOG_INTERVALS.set('5m', 5 * 60)
CHART_LOG_INTERVALS.set('10m', 10 * 60)
CHART_LOG_INTERVALS.set('15m', 15 * 60)
CHART_LOG_INTERVALS.set('30m', 30 * 60)
CHART_LOG_INTERVALS.set('1h', 60 * 60)
CHART_LOG_INTERVALS.set('2h', 2 * 60 * 60)
CHART_LOG_INTERVALS.set('4h', 4 * 60 * 60)
CHART_LOG_INTERVALS.set('6h', 6 * 60 * 60)
CHART_LOG_INTERVALS.set('1d', 24 * 60 * 60)
CHART_LOG_INTERVALS.set('1w', 7 * 24 * 60 * 60)

export const pricePrecision = BigInt.fromI32(2).pow(128)

export function encodeOrderId(
  bookId: string,
  tick: BigInt,
  orderIndex: BigInt,
): BigInt {
  const bookIdBigInt = BigInt.fromString(bookId)
  const tickU24 = BigInt.fromU32((tick.toU32() << 8) >> 8)
  return orderIndex
    .plus(tickU24.times(BigInt.fromI32(2).pow(40)))
    .plus(bookIdBigInt.times(BigInt.fromI32(2).pow(64)))
}

export function decodeBookIdFromOrderId(orderId: BigInt): string {
  return orderId.div(BigInt.fromI32(2).pow(64)).toString()
}

export function rawToBase(
  book: Book,
  rawAmount: BigInt,
  price: BigInt,
): BigInt {
  return rawAmount.times(book.unit).times(pricePrecision).div(price)
}

export function rawToQuote(book: Book, rawAmount: BigInt): BigInt {
  return rawAmount.times(book.unit)
}

export function buildDepthId(bookId: string, tick: BigInt): string {
  return bookId.concat('-').concat(tick.toString())
}

export function buildChartLogId(
  base: Token,
  quote: Token,
  intervalType: string,
  timestamp: i64,
): string {
  const marketCode = buildMarketCode(base, quote)
  return marketCode
    .concat('-')
    .concat(intervalType)
    .concat('-')
    .concat(timestamp.toString())
}

export function buildMarketCode(base: Token, quote: Token): string {
  return base.id.concat('/').concat(quote.id)
}

export function createToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString())
  if (token === null) {
    token = new Token(tokenAddress.toHexString())
    token.symbol = fetchTokenSymbol(tokenAddress)
    token.name = fetchTokenName(tokenAddress)
    token.decimals = fetchTokenDecimals(tokenAddress)
  }
  token.save()
  return token
}

export function formatPrice(price: BigInt): BigDecimal {
  return BigDecimal.fromString(price.toString()).div(
    pricePrecision.toBigDecimal(),
  )
}

export function formatInvertedPrice(price: BigInt): BigDecimal {
  return pricePrecision
    .toBigDecimal()
    .div(BigDecimal.fromString(price.toString()))
}

export function formatUnits(
  amount: BigInt,
  decimals: u8 = 18 as u8,
): BigDecimal {
  return BigDecimal.fromString(amount.toString()).div(
    BigDecimal.fromString(BigInt.fromI32(10).pow(decimals).toString()),
  )
}

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    '0x0000000000000000000000000000000000000000000000000000000000000001'
  )
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  if (tokenAddress.toHexString() == ADDRESS_ZERO) {
    return 'ETH'
  }
  const contract = ERC20.bind(tokenAddress)
  const contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  const symbolResult = contract.try_symbol()
  if (symbolResult.reverted) {
    const symbolResultBytes = contractSymbolBytes.try_symbol()
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function fetchTokenName(tokenAddress: Address): string {
  if (tokenAddress.toHexString() == ADDRESS_ZERO) {
    return 'Ether'
  }
  const contract = ERC20.bind(tokenAddress)
  const contractNameBytes = ERC20NameBytes.bind(tokenAddress)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  const nameResult = contract.try_name()
  if (nameResult.reverted) {
    const nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  if (tokenAddress.toHexString() == ADDRESS_ZERO) {
    return BigInt.fromI32(18)
  }
  const contract = ERC20.bind(tokenAddress)
  // try types uint8 for decimals
  let decimalValue = 18
  const decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }
  return BigInt.fromI32(decimalValue as i32)
}
