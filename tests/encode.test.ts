import { Address, BigInt } from '@graphprotocol/graph-ts'
import { describe, test, assert } from 'matchstick-as'

import { encodeOrderId } from '../src/common/order'

class MintFixture {
  bookId: BigInt
  user: Address
  orderIndex: BigInt
  uint: BigInt
  provider: Address
}

const MINT_FIXTURE: MintFixture = {
  bookId: BigInt.fromString(
    '2903842787083910905150096686205997338709207897290567260368',
  ),
  user: Address.fromString('0x6d8fa3025b6d6604309ca257563cca358c0cf1aa'),
  orderIndex: BigInt.fromString('267'),
  uint: BigInt.fromString('68227772598'),
  provider: Address.fromString('0x0000000000000000000000000000000000000000'),
}

describe('encode', () => {
  test('success - encodeOrderId', () => {
    assert.assertTrue(
      encodeOrderId(
        MINT_FIXTURE.bookId.toString(),
        BigInt.fromI32(-259218 as i32),
        MINT_FIXTURE.orderIndex,
      ) ==
        BigInt.fromString(
          '53566444723624360785422944131996696091141564570442382186621897550883387867403',
        ),
    )

    assert.assertTrue(
      encodeOrderId(
        MINT_FIXTURE.bookId.toString(),
        BigInt.fromI32(-1 as i32),
        MINT_FIXTURE.orderIndex,
      ) ==
        BigInt.fromString(
          '53566444723624360785422944131996696091141564570442382186622182562989005078795',
        ),
    )

    assert.assertTrue(
      encodeOrderId(
        MINT_FIXTURE.bookId.toString(),
        BigInt.fromI32(-2 as i32),
        MINT_FIXTURE.orderIndex,
      ) ==
        BigInt.fromString(
          '53566444723624360785422944131996696091141564570442382186622182561889493451019',
        ),
    )
  })
})
