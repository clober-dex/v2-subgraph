import { BigInt } from '@graphprotocol/graph-ts'

import { Swap } from '../generated/RouterGateway/RouterGateway'
import {
  TransactionSnapshot,
  VolumeSnapshot,
  WalletSnapshot,
} from '../generated/schema'

import { getOrCreateSnapshot } from './helpers'

export function handleSwap(event: Swap): void {
  const snapshot = getOrCreateSnapshot(event.block.timestamp)

  // Create TransactionSnapshot
  const transactionSnapshotId = snapshot.id
    .concat('-')
    .concat(event.transaction.hash.toHexString())
  let transactionSnapshot = TransactionSnapshot.load(transactionSnapshotId)
  if (transactionSnapshot === null) {
    transactionSnapshot = new TransactionSnapshot(transactionSnapshotId)
    transactionSnapshot.txHash = event.transaction.hash.toHexString()
    transactionSnapshot.timestamp = BigInt.fromString(snapshot.id)
    transactionSnapshot.save()
    snapshot.transactionCount = snapshot.transactionCount.plus(
      BigInt.fromI32(1),
    )
  }

  // Create WalletSnapshot
  const walletSnapshotId = snapshot.id
    .concat('-')
    .concat(event.params.user.toHexString())
  let walletSnapshot = WalletSnapshot.load(walletSnapshotId)
  if (walletSnapshot === null) {
    walletSnapshot = new WalletSnapshot(walletSnapshotId)
    walletSnapshot.wallet = event.params.user.toHexString()
    walletSnapshot.timestamp = BigInt.fromString(snapshot.id)
    walletSnapshot.save()
    snapshot.walletCount = snapshot.walletCount.plus(BigInt.fromI32(1))
  }

  // Create VolumeSnapshot
  const volumeSnapshotId = snapshot.id
    .concat('-')
    .concat(event.params.inToken.toHexString())
  let volumeSnapshot = VolumeSnapshot.load(volumeSnapshotId)
  if (volumeSnapshot === null) {
    volumeSnapshot = new VolumeSnapshot(volumeSnapshotId)
    volumeSnapshot.token = event.params.inToken.toHexString()
    volumeSnapshot.amount = event.params.amountIn
    volumeSnapshot.save()
  }

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
