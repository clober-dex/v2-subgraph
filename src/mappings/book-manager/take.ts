import { BigInt } from '@graphprotocol/graph-ts'

import { Take } from '../../../generated/BookManager/BookManager'
import {
  CloberDayData,
  ContractInteractionDayData,
} from '../../../generated/schema'

const ZERO_BI = BigInt.fromI32(0)
const ONE_BI = BigInt.fromI32(1)

export function handleTake(event: Take): void {
  const bookId = event.params.bookId
  if (
    !bookId.equals(
      BigInt.fromString(
        '3875727077379471850923186002296331935053867847116966170720',
      ),
    ) &&
    !bookId.equals(
      BigInt.fromString(
        '5954885684956363054050231031211743946744177791604395877538',
      ),
    )
  ) {
    return
  }
  if (!event.transaction.to) {
    return
  }

  const timestamp = event.block.timestamp.toI32()
  const dayID = timestamp / 86400 // rounded
  const dayStartTimestamp = dayID * 86400
  let cloberDayData = CloberDayData.load(dayID.toString())
  if (cloberDayData === null) {
    cloberDayData = new CloberDayData(dayID.toString())
    cloberDayData.date = dayStartTimestamp
  }

  const contract = event.transaction.to!
  const contractInteractionDayDataId = contract
    .toHexString()
    .concat('-')
    .concat(dayID.toString())
  let contractInteractionDayData = ContractInteractionDayData.load(
    contractInteractionDayDataId,
  )
  if (contractInteractionDayData === null) {
    contractInteractionDayData = new ContractInteractionDayData(
      contractInteractionDayDataId,
    )
    contractInteractionDayData.date = dayStartTimestamp
    contractInteractionDayData.contract = contract
    contractInteractionDayData.callCount = ZERO_BI
  }

  contractInteractionDayData.callCount =
    contractInteractionDayData.callCount.plus(ONE_BI)
  contractInteractionDayData.save()
}
