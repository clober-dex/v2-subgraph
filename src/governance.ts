import { store } from '@graphprotocol/graph-ts'

import { Transfer1 } from '../generated/VoteLockedCloberToken/VoteLockedCloberToken'
import { VCLOB } from '../generated/schema'

import { ADDRESS_ZERO } from './helpers'

export function handleVCLOBTransfer(event: Transfer1): void {
  const id = event.params.id.toString()
  const from = event.params.from.toHexString()
  const to = event.params.to.toHexString()
  const amount = event.params.value

  if (from == ADDRESS_ZERO) {
    const vclob = new VCLOB(id)
    vclob.owner = to
    vclob.amount = amount
    vclob.lockedTimepoint = event.block.timestamp
    vclob.save()
  } else if (to == ADDRESS_ZERO) {
    store.remove('VCLOB', id)
  } else {
    const vclob = VCLOB.load(id)!
    vclob.owner = to
    vclob.save()
  }
}
