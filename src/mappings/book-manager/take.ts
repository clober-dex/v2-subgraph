import { BigInt } from '@graphprotocol/graph-ts'

import { Take } from '../../../generated/BookManager/BookManager'
import {
  CloberDayData,
  ContractInteractionDayData,
} from '../../../generated/schema'
import { ONE_BI, ZERO_BD, ZERO_BI } from '../../common/constants'
import { tickToPrice } from '../../common/tick'
import { unitToBase } from '../../common/amount'
import { convertTokenToDecimal } from '../../common/utils'

export function handleTake(event: Take): void {
  const bookId = event.params.bookId
  if (
    !bookId.equals(
      BigInt.fromString(
        '3875727077379471850923186002296331935053867847116966170720', // ask
      ),
    ) &&
    !bookId.equals(
      BigInt.fromString(
        '5954885684956363054050231031211743946744177791604395877538', // bid
      ),
    )
  ) {
    return
  }
  if (!event.transaction.to) {
    return
  }
  const isTakingBidBook = bookId.equals(
    BigInt.fromString(
      '5954885684956363054050231031211743946744177791604395877538',
    ),
  )
  const priceRaw = tickToPrice(event.params.tick)
  const volumeUsd = isTakingBidBook
    ? event.params.unit
    : unitToBase(
        BigInt.fromString('1000000000000'),
        event.params.unit,
        priceRaw,
      )
  const volumeUsdBD = convertTokenToDecimal(volumeUsd, BigInt.fromI32(6))

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
    contractInteractionDayData.volumeUSD = ZERO_BD
  }

  contractInteractionDayData.callCount =
    contractInteractionDayData.callCount.plus(ONE_BI)
  contractInteractionDayData.volumeUSD =
    contractInteractionDayData.volumeUSD.plus(volumeUsdBD)
  contractInteractionDayData.save()
  cloberDayData.save()
}
