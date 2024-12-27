import { Transfer } from '../generated/templates/ERC20/ERC20'

import { createTokenBalance, createToken } from './helpers'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function handleTransfer(event: Transfer): void {
  const token = createToken(event.address)
  if (event.params.from.toHexString() !== ZERO_ADDRESS) {
    const fromBalance = createTokenBalance(token, event.params.from)
    fromBalance.amount = fromBalance.amount.minus(event.params.value)
    fromBalance.updatedAt = event.block.timestamp
    fromBalance.save()
  }

  const toBalance = createTokenBalance(token, event.params.to)
  toBalance.amount = toBalance.amount.plus(event.params.value)
  toBalance.updatedAt = event.block.timestamp
  toBalance.save()
}
