import { Transfer } from '../../../generated/BookManager/BookManager'
import { ADDRESS_ZERO } from '../../common/constants'
import { getOpenOrderOrLog } from '../../common/entity-getters'

export function handleTransfer(event: Transfer): void {
  const from = event.params.from
  const to = event.params.to
  const orderID = event.params.tokenId

  if (from.toHexString() == ADDRESS_ZERO || to.toHexString() == ADDRESS_ZERO) {
    // mint or burn events are handled in the make, cancel, and claim events
    return
  }

  const openOrder = getOpenOrderOrLog(orderID.toString(), 'TRANSFER')
  if (openOrder === null) {
    return
  }

  openOrder.owner = to
  openOrder.save()
}
