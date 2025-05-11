import { BigInt, log } from '@graphprotocol/graph-ts'
import { assert, describe, test } from 'matchstick-as'

import { formatInvertedPrice, formatPrice } from '../src/common/tick'

describe('price', () => {
  test('success - formatPrice', () => {
    assert.assertTrue(
      formatPrice(
        BigInt.fromString('1269775961966168609'),
        BigInt.fromI32(18),
        BigInt.fromI32(6),
      ).toString() == '16.02682583655220521761421525216527',
    )

    assert.assertTrue(
      formatInvertedPrice(
        BigInt.fromString('4945944089461862069088262812632104895228'),
        BigInt.fromI32(6),
        BigInt.fromI32(18),
      ).toString() == '16.01881482709697785125107936300037',
    )
  })
})
