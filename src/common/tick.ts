import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import { exponentToBigDecimal } from './utils'
import { ONE_BD, ZERO_BD } from './constants'

const R = [
  BigInt.fromString('79220240490215316061937756560'), // 0xfff97272373d413259a46990
  BigInt.fromString('79212319258289487113226433916'), // 0xfff2e50f5f656932ef12357c
  BigInt.fromString('79196479170490597288862688490'), // 0xffe5caca7e10e4e61c3624ea
  BigInt.fromString('79164808496886665658930780291'), // 0xffcb9843d60f6159c9db5883
  BigInt.fromString('79101505139923049997807806614'), // 0xff973b41fa98c081472e6896
  BigInt.fromString('78975050245229982702767995059'), // 0xff2ea16466c96a3843ec78b3
  BigInt.fromString('78722746600537056721934508529'), // 0xfe5dee046a99a2a811c461f1
  BigInt.fromString('78220554859095770638340573243'), // 0xfcbe86c7900a88aedcffc83b
  BigInt.fromString('77225761753129597550065289036'), // 0xf987a7253ac413176f2b074c
  BigInt.fromString('75273969370139069689486932537'), // 0xf3392b0822b70005940c7a39
  BigInt.fromString('71517125791179246722882903167'), // 0xe7159475a2c29b7443b29c7f
  BigInt.fromString('64556580881331167221767657719'), // 0xd097f3bdfd2022b8845ad8f7
  BigInt.fromString('52601903197458624361810746399'), // 0xa9f746462d870fdf8a65dc1f
  BigInt.fromString('34923947901690145425342545398'), // 0x70d869a156d2a1b890bb3df6
  BigInt.fromString('15394552875315951095595078917'), // 0x31be135f97d08fd981231505
  BigInt.fromString('2991262837734375505310244436'), // 0x9aa508b5b7a84e1c677de54
  BigInt.fromString('112935262922445818024280873'), // 0x5d6af8dedb81196699c329
  BigInt.fromString('160982827401375763736068'), // 0x2216e584f5fa1ea92604
  BigInt.fromString('327099227039063106'), // 0x48a170391f7dc42
  BigInt.fromString('1350452'), // 0x149b34
]

export const PRICE_PRECISION = BigInt.fromI32(2).pow(96)

export function tickToPrice(tick: i32): BigInt {
  if (tick > 524287 || tick < -524287) {
    throw new Error('Invalid tick')
  }

  const absTick = BigInt.fromI32(tick < 0 ? -tick : tick)
  let price = BigInt.fromI32(1)

  if (absTick.bitAnd(BigInt.fromI32(1)).notEqual(BigInt.fromI32(0))) {
    price = R[0]
  } else {
    price = BigInt.fromI32(1).leftShift(96)
  }

  for (let i = 1; i < 19; i++) {
    if (absTick.bitAnd(BigInt.fromI32(1 << i)).notEqual(BigInt.fromI32(0))) {
      price = price.times(R[i]).rightShift(96)
    }
  }

  if (tick > 0) {
    price = BigInt.fromString(
      '6277101735386680763835789423207666416102355444464034512896',
    ).div(price) // 0x1000000000000000000000000000000000000000000000000
  }

  return price
}

export function formatPrice(
  price: BigInt,
  baseDecimals: BigInt,
  quoteDecimals: BigInt,
): BigDecimal {
  return BigDecimal.fromString(price.toString())
    .div(PRICE_PRECISION.toBigDecimal())
    .times(exponentToBigDecimal(baseDecimals))
    .div(exponentToBigDecimal(quoteDecimals))
}

export function formatInvertedPrice(
  price: BigInt,
  baseDecimals: BigInt,
  quoteDecimals: BigInt,
): BigDecimal {
  if (price.isZero()) {
    return ZERO_BD
  }
  return ONE_BD.div(formatPrice(price, baseDecimals, quoteDecimals))
}
