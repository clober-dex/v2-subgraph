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

import { ADDRESS_ZERO, createToken } from './helpers'
import {
  fetchPoolAddress,
  fetchPriorMilestones,
  fetchSubsequentMilestones,
  fetchTokenInfo,
} from './utils/hatchhog'

const MIGRATION_AMOUNT = BigInt.fromI32(241_000_000).times(
  BigInt.fromI32(10).pow(18),
)

export function handleSetFeeReceiver(event: SetFeeReceiver): void {
  const hatchhog = loadHatchhog(event.address)
  hatchhog.feeReceiver = event.params.feeReceiver.toString()
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
  hatchhog.owner = event.params.newOwner.toString()
  hatchhog.save()
}

export function handleHatch(event: Hatch): void {
  const tokenInfo = fetchTokenInfo(event.address, event.params.token)
  const token = createToken(event.params.token)
  const hog = new HogToken(event.params.token.toString())
  hog.token = token.id
  hog.creator = event.params.creator.toHexString()
  hog.createdAt = event.block.timestamp
  hog.deadline = tokenInfo.deadline
  hog.migrationFeeRate = BigInt.fromI32(tokenInfo.migrationFeeRate)
  hog.achievementFeeRate = BigInt.fromI32(tokenInfo.achievementFeeRate)
  hog.bidBook = tokenInfo.bidBookId.toString()
  hog.askBook = tokenInfo.askBookId.toString()
  hog.migrated = false
  hog.burntAmount = BigInt.zero()
  hog.pool = fetchPoolAddress(event.address, event.params.token).toString()
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
  let hatchhog = Hatchhog.load(address.toString())
  if (hatchhog == null) {
    hatchhog = new Hatchhog(address.toString())
    hatchhog.migrationFeeRate = BigInt.zero()
    hatchhog.achievementFeeRate = BigInt.zero()
    hatchhog.feeReceiver = ADDRESS_ZERO
    hatchhog.owner = ADDRESS_ZERO
    hatchhog.save()
  }
  return hatchhog
}
