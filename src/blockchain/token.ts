import { Address, BigInt } from '@graphprotocol/graph-ts'

import { ERC20 } from '../../generated/BookManager/ERC20'
import { ERC20NameBytes } from '../../generated/BookManager/ERC20NameBytes'
import { ERC20SymbolBytes } from '../../generated/BookManager/ERC20SymbolBytes'
import {
  ADDRESS_ZERO,
  getNativeTokenName,
  getNativeTokenSymbol,
} from '../utils'

export function fetchTokenSymbol(
  tokenAddress: Address,
  chainId: BigInt,
): string {
  if (tokenAddress.equals(ADDRESS_ZERO)) {
    return getNativeTokenSymbol(chainId)
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
      if (!isNullValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function fetchTokenName(tokenAddress: Address, chainId: BigInt): string {
  if (tokenAddress.equals(ADDRESS_ZERO)) {
    return getNativeTokenName(chainId)
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
      if (!isNullValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  if (tokenAddress.equals(ADDRESS_ZERO)) {
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

function isNullValue(value: string): boolean {
  return (
    value ==
    '0x0000000000000000000000000000000000000000000000000000000000000001'
  )
}
