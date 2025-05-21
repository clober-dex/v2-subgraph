import { BigDecimal, log } from '@graphprotocol/graph-ts'
import { assert, describe, test } from 'matchstick-as'

import {
  getFeeRate,
  getUsesFeeInQuote,
} from '../src/mappings/book-manager/open'

describe('decode', () => {
  test('success - decode negative fee policy', () => {
    assert.assertTrue(
      getFeeRate(8888308 as i32) == BigDecimal.fromString('-0.0003'),
    )
    assert.assertTrue(getUsesFeeInQuote(8888308 as i32) == true)

    assert.assertTrue(
      getFeeRate(499700 as i32) == BigDecimal.fromString('-0.0003'),
    )
    assert.assertTrue(getUsesFeeInQuote(499700 as i32) == false)
  })

  test('success - decode positive fee policy', () => {
    assert.assertTrue(
      getFeeRate(8889608 as i32) == BigDecimal.fromString('0.001'),
    )
    assert.assertTrue(getUsesFeeInQuote(8889608 as i32) == true)

    assert.assertTrue(
      getFeeRate(501000 as i32) == BigDecimal.fromString('0.001'),
    )
    assert.assertTrue(getUsesFeeInQuote(501000 as i32) == false)
  })
})
