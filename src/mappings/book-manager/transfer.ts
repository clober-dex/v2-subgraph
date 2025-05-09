import { log } from '@graphprotocol/graph-ts'

import { Transfer } from '../../../generated/BookManager/BookManager'
import { ADDRESS_ZERO } from '../../common/constants'
import { OpenOrder } from '../../../generated/schema'

export function handleTransfer(event: Transfer): void {
  const from = event.params.from
  const to = event.params.to
  const orderId = event.params.tokenId

  if (from.toHexString() == ADDRESS_ZERO || to.toHexString() == ADDRESS_ZERO) {
    // mint or burn events are handled in the make, cancel, and claim events
    return
  }

  const openOrder = OpenOrder.load(orderId.toString())
  if (openOrder === null) {
    log.error('[TRANSFER] OpenOrder not found: {}', [orderId.toString()])
    return
  }

  openOrder.owner = to
  openOrder.save()
}
