import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import { Transfer } from '../generated/templates/ERC20/ERC20'
import { Token } from '../generated/schema'

import { createTokenBalance, createToken } from './helpers'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function handleTransfer(event: Transfer): void {
  const token = createToken(event.address)
  handleTransferInner(
    token,
    event.params.from,
    event.params.to,
    event.params.value,
    event.block.timestamp,
  )
}

export function handleTransferInner(
  token: Token,
  from: Address,
  to: Address,
  value: BigInt,
  timestamp: BigInt,
) {
  // todo: check
  if (from.toHexString() !== ZERO_ADDRESS) {
    const fromBalance = createTokenBalance(token, from)
    fromBalance.amount = fromBalance.amount.minus(
      BigDecimal.fromString(value.toString()),
    )
    fromBalance.updatedAt = timestamp
    fromBalance.save()
  }
  const toBalance = createTokenBalance(token, to)
  toBalance.amount = toBalance.amount.plus(
    BigDecimal.fromString(value.toString()),
  )
  toBalance.updatedAt = timestamp
  toBalance.save()
}
