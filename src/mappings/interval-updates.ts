import { ethereum } from '@graphprotocol/graph-ts'

import {
  BookDayData,
  PoolDayData,
  PoolHourData,
  TokenDayData,
} from '../../generated/schema'

export function updateBookDayData(event: ethereum.Event): BookDayData {}

export function updateTokenDayData(event: ethereum.Event): TokenDayData {}

export function updatePoolDayData(event: ethereum.Event): PoolDayData {}

export function updatePoolHourData(event: ethereum.Event): PoolHourData {}
