import { BigInt } from '@graphprotocol/graph-ts'

import { Take } from '../../../generated/BookManager/BookManager'
import {
  CloberDayData,
  ContractInteraction,
  ContractInteractionDayData,
} from '../../../generated/schema'
import { ONE_BI, ZERO_BD, ZERO_BI } from '../../common/constants'
import { tickToPrice } from '../../common/tick'
import { unitToBase } from '../../common/amount'
import { convertTokenToDecimal } from '../../common/utils'
import { BID_BOOK_ID } from '../../common/chain'
import { ASK_BOOK_ID } from '../../../config/base/chain'

export function handleTake(event: Take): void {
  const bookId = event.params.bookId
  if (!bookId.equals(BID_BOOK_ID) && !bookId.equals(ASK_BOOK_ID)) {
    return
  }
  if (!event.transaction.to) {
    return
  }
  const isTakingBidBook = bookId.equals(ASK_BOOK_ID)
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
    contractInteractionDayData.cloberDayData = cloberDayData.id
  }
  let contractInteraction = ContractInteraction.load(contract.toHexString())
  if (contractInteraction === null) {
    contractInteraction = new ContractInteraction(contract.toHexString())
    contractInteraction.callCount = ZERO_BI
    contractInteraction.volumeUSD = ZERO_BD
  }

  contractInteractionDayData.callCount =
    contractInteractionDayData.callCount.plus(ONE_BI)
  contractInteractionDayData.volumeUSD =
    contractInteractionDayData.volumeUSD.plus(volumeUsdBD)

  contractInteraction.callCount = contractInteraction.callCount.plus(ONE_BI)
  contractInteraction.volumeUSD =
    contractInteraction.volumeUSD.plus(volumeUsdBD)

  contractInteractionDayData.save()
  contractInteraction.save()
  cloberDayData.save()
}
