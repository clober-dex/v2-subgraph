import { Take } from '../../../generated/BookManager/BookManager'
import {
  CloberDayData,
  ContractInteractionDayData,
} from '../../../generated/schema'
import { ONE_BI, ZERO_BI } from '../../common/constants'

export function handleTake(event: Take): void {
  const timestamp = event.block.timestamp.toI32()
  const dayID = timestamp / 86400 // rounded
  const dayStartTimestamp = dayID * 86400
  let cloberDayData = CloberDayData.load(dayID.toString())
  if (cloberDayData === null) {
    cloberDayData = new CloberDayData(dayID.toString())
    cloberDayData.date = dayStartTimestamp
  }

  const contract = event.transaction.to
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
