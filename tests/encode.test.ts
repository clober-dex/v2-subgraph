import { Address, BigInt } from '@graphprotocol/graph-ts'
import { describe, test, assert } from 'matchstick-as'

import { encodeOrderId } from '../src/utils'

class MintFixture {
  bookId: BigInt
  user: Address
  tick: i32
  orderIndex: BigInt
  uint: BigInt
  provider: Address
}

const MINT_FIXTURE: MintFixture = {
  bookId: BigInt.fromString(
    '2903842787083910905150096686205997338709207897290567260368',
  ),
  user: Address.fromString('0x6d8fa3025b6d6604309ca257563cca358c0cf1aa'),
  tick: i32(-259218),
  orderIndex: BigInt.fromString('267'),
  uint: BigInt.fromString('68227772598'),
  provider: Address.fromString('0x0000000000000000000000000000000000000000'),
}

describe('encode', () => {
  test('success - encodeOrderId', () => {
    const orderId = encodeOrderId(
      MINT_FIXTURE.bookId.toString(),
      BigInt.fromI32(MINT_FIXTURE.tick as i32),
      MINT_FIXTURE.orderIndex,
    )

    assert.assertTrue(
      orderId ==
        BigInt.fromString(
          '53566444723624360785422944131996696091141564570442382186621897550883387867403',
        ),
    )
  })
})
