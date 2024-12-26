import { Address, BigInt } from '@graphprotocol/graph-ts'

import {
  Hatch,
  Migrate,
  OwnershipTransferred,
  SetAchievementFeeRate,
  SetFeeReceiver,
  SetMigrationFeeRate,
} from '../generated/Hatchhog/Hatchhog'
import { Hatchhog, HogToken } from '../generated/schema'
import { ERC20 } from '../generated/templates'

import {
  ADDRESS_ZERO,
  createToken,
  fetchPoolAddress,
  fetchPriorMilestones,
  fetchSubsequentMilestones,
  fetchTokenInfo,
} from './helpers'
import { handleTransferInner } from './token'

const MIGRATION_AMOUNT = BigInt.fromI32(241_000_000).times(
  BigInt.fromI32(10).pow(18),
)

export function handleSetFeeReceiver(event: SetFeeReceiver): void {
  const hatchhog = loadHatchhog(event.address)
  hatchhog.feeReceiver = event.params.feeReceiver.toHexString()
  hatchhog.save()
}

export function handleSetMigrationFeeRate(event: SetMigrationFeeRate): void {
  const hatchhog = loadHatchhog(event.address)
  hatchhog.migrationFeeRate = BigInt.fromI32(event.params.feeRate)
  hatchhog.save()
}

export function handleSetAchievementFeeRate(
  event: SetAchievementFeeRate,
): void {
  const hatchhog = loadHatchhog(event.address)
  hatchhog.achievementFeeRate = BigInt.fromI32(event.params.feeRate)
  hatchhog.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const hatchhog = loadHatchhog(event.address)
  hatchhog.owner = event.params.newOwner.toHexString()
  hatchhog.save()
}

export function handleHatch(event: Hatch): void {
  const tokenInfo = fetchTokenInfo(event.address, event.params.token)
  const token = createToken(event.params.token)
  ERC20.create(event.params.token)
  const receipt = event.receipt
  if (receipt == null) {
    throw new Error('Receipt not found')
  }
  for (let i = 0; i < receipt.logs.length; i++) {
    const log = receipt.logs[i]
    if (
      log.address == event.params.token &&
      log.logIndex < event.logIndex &&
      log.topics[0].toHexString() ==
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer(address,address,uint256)
    ) {
      handleTransferInner(
        token,
        Address.fromString('0x' + log.topics[1].toHexString().slice(26)),
        Address.fromString('0x' + log.topics[2].toHexString().slice(26)),
        BigInt.fromSignedBytes(log.data),
        event.block.timestamp,
      )
    }
  }
  const hog = new HogToken(event.params.token.toHexString())
  hog.token = token.id
  hog.name = token.name
  hog.symbol = token.symbol
  hog.uri = event.params.tokenURI
  hog.creator = event.params.creator.toHexString()
  hog.createdAt = event.block.timestamp
  hog.deadline = tokenInfo.deadline
  hog.migrationFeeRate = BigInt.fromI32(tokenInfo.migrationFeeRate)
  hog.achievementFeeRate = BigInt.fromI32(tokenInfo.achievementFeeRate)
  hog.bidBook = tokenInfo.bidBookId.toString()
  hog.askBook = tokenInfo.askBookId.toString()
  hog.migrated = false
  hog.burntAmount = BigInt.zero()
  hog.pool = fetchPoolAddress(event.address, event.params.token).toHexString()
  hog.priorMilestones = []
  hog.subsequentMilestones = []
  const priorMilestones = hog.priorMilestones
  const fetchedPriorMilestones = fetchPriorMilestones(
    event.address,
    event.params.token,
  )
  for (let i = 0; i < fetchedPriorMilestones.length; i++) {
    priorMilestones.push(fetchedPriorMilestones[i].toString())
  }
  hog.priorMilestones = priorMilestones
  const subsequentMilestones = hog.subsequentMilestones
  const fetchedSubsequentMilestones = fetchSubsequentMilestones(
    event.address,
    event.params.token,
  )
  for (let i = 0; i < fetchedSubsequentMilestones.length; i++) {
    subsequentMilestones.push(fetchedSubsequentMilestones[i].toString())
  }
  hog.subsequentMilestones = subsequentMilestones
  hog.save()
}

export function handleMigrate(event: Migrate): void {
  const hog = HogToken.load(event.params.token.toHexString())
  if (hog == null) {
    throw new Error('HogToken not found')
  }
  hog.migrated = true
  hog.burntAmount = MIGRATION_AMOUNT.minus(event.params.tokenAmount)
  hog.save()
}

function loadHatchhog(address: Address): Hatchhog {
  let hatchhog = Hatchhog.load(address.toHexString())
  if (hatchhog == null) {
    hatchhog = new Hatchhog(address.toHexString())
    hatchhog.migrationFeeRate = BigInt.zero()
    hatchhog.achievementFeeRate = BigInt.zero()
    hatchhog.feeReceiver = ADDRESS_ZERO
    hatchhog.owner = ADDRESS_ZERO
    hatchhog.save()
  }
  return hatchhog
}
