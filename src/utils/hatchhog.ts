import { Address } from '@graphprotocol/graph-ts'

import { Hatchhog } from '../../generated/Hatchhog/Hatchhog'

export function fetchTokenInfo(hatchhog: Address, token: Address) {
  const contract = Hatchhog.bind(hatchhog)
  const tokenInfo = contract.try_tokenInfo(token)
  if (!tokenInfo.reverted) {
    throw new Error('Token not found')
  }
  return tokenInfo.value
}

export function fetchPoolAddress(hatchhog: Address, token: Address) {
  const contract = Hatchhog.bind(hatchhog)
  const poolAddress = contract.try_computePoolAddress(token)
  if (!poolAddress.reverted) {
    throw new Error('Token not found')
  }
  return poolAddress.value
}

export function fetchPriorMilestones(hatchhog: Address, token: Address) {
  const contract = Hatchhog.bind(hatchhog)
  const milestones = contract.try_getSubsequentMilestones(token)
  if (!milestones.reverted) {
    throw new Error('Token not found')
  }
  return milestones.value
}

export function fetchSubsequentMilestones(hatchhog: Address, token: Address) {
  const contract = Hatchhog.bind(hatchhog)
  const milestones = contract.try_getSubsequentMilestones(token)
  if (!milestones.reverted) {
    throw new Error('Token not found')
  }
  return milestones.value
}
