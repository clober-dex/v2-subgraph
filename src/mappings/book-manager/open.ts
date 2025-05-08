import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import { Open } from '../../../generated/BookManager/BookManager'
import { Book } from '../../../generated/schema'

const FEE_PRECISION = BigDecimal.fromString('1000000')

export function handleOpen(event: Open): void {
  const book = new Book(event.params.id.toString())
  book.createdAtTimestamp = event.block.timestamp
  book.createdAtBlockNumber = event.block.number
  book.base = base.id
  book.quote = quote.id
  book.unitSize = event.params.unitSize
  book.makerPolicy = BigInt.fromI32(event.params.makerPolicy)
  book.makerFee = BigDecimal.fromString(event.params.makerFee.toString()).div(
    FEE_PRECISION,
  )
  book.takerFee = BigDecimal.fromString(event.params.takerFee.toString()).div(
    FEE_PRECISION,
  )
  book.takerPolicy = BigInt.fromI32(event.params.takerPolicy)
  book.hooks = event.params.hooks.toHexString()
  book.save()
}
