import { Bytes, ethereum, log } from '@graphprotocol/graph-ts'

import { FeeCollected, Swap } from '../../generated/RouterGateway/RouterGateway'
import {
  RouterDayData,
  Swap as SwapEntity,
  Take as TakeEntity,
  Token,
} from '../../generated/schema'
import { ONE_BI, ZERO_BD, ZERO_BI } from '../common/constants'
import { calculateValueUSD, getTokenUSDPriceFlat } from '../common/pricing'
import { convertTokenToDecimal } from '../common/utils'
import { SKIP_TAKE_AND_SWAP } from '../common/chain'

import {
  updateDayData,
  updateTokenDayData,
  updateUserDayVolume,
  updateUserNativeVolume,
} from './interval-updates'

const TAKE_EVENT_TOPIC =
  '0xc4c20b9c4a5ada3b01b7a391a08dd81a1be01dd8ef63170dd9da44ecee3db11b'

export function handleSwap(event: Swap): void {
  updateDayData(event)

  const precedingTakeLogs = (
    event.receipt as ethereum.TransactionReceipt
  ).logs.filter((log) => log.topics[0].toHexString() == TAKE_EVENT_TOPIC)

  let bookTakenIn = ZERO_BI
  let bookTakenOut = ZERO_BI
  for (let i = 0; i < precedingTakeLogs.length; i++) {
    const log = precedingTakeLogs[i]
    const takeID = event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(log.logIndex.toString())
    const take = TakeEntity.load(takeID)
    if (
      take &&
      event.params.inToken.equals(take.inputToken) &&
      event.params.outToken.equals(take.outputToken)
    ) {
      bookTakenIn = bookTakenIn.plus(take.inputAmount)
      bookTakenOut = bookTakenOut.plus(take.outputAmount)
    }
  }

  const inputToken = Token.load(event.params.inToken)
  const outputToken = Token.load(event.params.outToken)

  const swap = new SwapEntity(
    event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.logIndex.toString()),
  )
  swap.transaction = event.transaction.hash.toHexString()
  swap.timestamp = event.block.timestamp
  swap.inputToken = event.params.inToken
  swap.outputToken = event.params.outToken
  swap.origin = event.transaction.from
  swap.inputAmount = event.params.amountIn.minus(bookTakenIn)
  swap.outputAmount = event.params.amountOut.minus(bookTakenOut)
  swap.router = event.params.router
  swap.fee = ZERO_BI
  if (
    inputToken &&
    outputToken &&
    swap.inputAmount.ge(ZERO_BI) &&
    swap.outputAmount.ge(ZERO_BI)
  ) {
    const inputAmountDecimal = convertTokenToDecimal(
      swap.inputAmount,
      inputToken.decimals,
    )
    const outputAmountDecimal = convertTokenToDecimal(
      swap.outputAmount,
      outputToken.decimals,
    )
    const priceIn = getTokenUSDPriceFlat(inputToken)
    const priceOut = getTokenUSDPriceFlat(outputToken)

    swap.amountUSD = calculateValueUSD(
      inputAmountDecimal,
      priceIn,
      outputAmountDecimal,
      priceOut,
    )
    const inputArgs = event.transaction.input.slice(4)
    const decoded = ethereum.decode(
      '(address,address,uint256,uint256,address,bytes)',
      Bytes.fromUint8Array(inputArgs),
    )
    if (decoded) {
      const tuple = decoded.toTuple()
      if (tuple.length >= 5) {
        swap.router = tuple[4].toAddress()
      }
    }

    if (priceIn.gt(ZERO_BD)) {
      updateUserDayVolume(inputToken, event, inputAmountDecimal, swap.amountUSD)
      const inputTokenDayData = updateTokenDayData(inputToken, priceIn, event)
      inputTokenDayData.volume =
        inputTokenDayData.volume.plus(inputAmountDecimal)
      inputTokenDayData.volumeUSD = inputTokenDayData.volumeUSD.plus(
        swap.amountUSD,
      )
      // exclude the protocol fee from the volume
      inputTokenDayData.save()
    } else if (priceOut.gt(ZERO_BD)) {
      updateUserDayVolume(
        outputToken,
        event,
        outputAmountDecimal,
        swap.amountUSD,
      )
      const outputTokenDayData = updateTokenDayData(
        outputToken,
        priceOut,
        event,
      )
      outputTokenDayData.volume =
        outputTokenDayData.volume.plus(outputAmountDecimal)
      outputTokenDayData.volumeUSD = outputTokenDayData.volumeUSD.plus(
        swap.amountUSD,
      )
      // exclude the protocol fee from the volume
      outputTokenDayData.save()
    }
    updateUserNativeVolume(
      event,
      swap.inputToken,
      swap.outputToken,
      swap.inputAmount,
      swap.outputAmount,
    )
  } else {
    log.warning(
      'Swap USD skipped: inputToken or outputToken missing or invalid amounts. tx: {}',
      [event.transaction.hash.toHexString()],
    )
    swap.amountUSD = ZERO_BD
  }
  swap.logIndex = event.logIndex
  if (
    !SKIP_TAKE_AND_SWAP &&
    swap.inputAmount.gt(ZERO_BI) &&
    swap.outputAmount.gt(ZERO_BI)
  ) {
    swap.save()

    const dayID = swap.timestamp.toI32() / 86400 // rounded
    const routerDayID = swap.router
      .toHexString()
      .concat('-')
      .concat(dayID.toString())
    let routerDayData = RouterDayData.load(routerDayID)
    if (routerDayData === null) {
      routerDayData = new RouterDayData(routerDayID)
      routerDayData.date = dayID
      routerDayData.cloberDayData = dayID.toString()
      routerDayData.router = swap.router
      routerDayData.txCount = ZERO_BI
    }
    routerDayData.txCount = routerDayData.txCount.plus(ONE_BI)
    routerDayData.save()
  }
}

export function handleFeeCollected(event: FeeCollected): void {
  const swap = SwapEntity.load(
    event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.logIndex.minus(ONE_BI).toString()),
  )
  if (swap) {
    const token = Token.load(event.params.token)!
    const price = getTokenUSDPriceFlat(token)
    const feeAmountDecimal = convertTokenToDecimal(
      event.params.amount,
      token.decimals,
    )
    const tokenDayData = updateTokenDayData(token, price, event)
    tokenDayData.protocolFees = tokenDayData.protocolFees.plus(feeAmountDecimal)
    tokenDayData.protocolFeesUSD = tokenDayData.protocolFeesUSD.plus(
      feeAmountDecimal.times(price),
    )

    swap.fee = event.params.amount

    swap.save()
    tokenDayData.save()
  } else {
    log.error('Swap not found for FeeCollected event: {}', [
      event.transaction.hash.toHexString(),
    ])
  }
}
