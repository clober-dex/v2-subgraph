import { Swap } from '../../generated/RouterGateway/RouterGateway'
import {
  getOrCreateSnapshot,
  getOrCreateVolumeSnapshot,
  updateTransactionsInSnapshot,
  updateWalletsInSnapshot,
} from '../helpers'

export function handleSwap(event: Swap): void {
  const snapshot = getOrCreateSnapshot(event.block.timestamp)

  // Create TransactionSnapshot
  updateTransactionsInSnapshot(snapshot, event.transaction.hash)

  // Create WalletSnapshot
  updateWalletsInSnapshot(snapshot, event.params.user)

  // Create VolumeSnapshot
  const volumeSnapshot = getOrCreateVolumeSnapshot(
    event.block.timestamp,
    event.params.inToken,
  )
  volumeSnapshot.amount = volumeSnapshot.amount.plus(event.params.amountIn)
  volumeSnapshot.save()

  let find = false
  for (let i = 0; i < snapshot.volumeSnapshots.length; i++) {
    if (snapshot.volumeSnapshots[i] == volumeSnapshot.id) {
      find = true
      break
    }
  }
  if (!find) {
    const volumeSnapshots = snapshot.volumeSnapshots
    volumeSnapshots.push(volumeSnapshot.id)
    snapshot.volumeSnapshots = volumeSnapshots
  }
  snapshot.save()
}
