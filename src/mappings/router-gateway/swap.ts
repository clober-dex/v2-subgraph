import { Swap } from '../../../generated/RouterGateway/RouterGateway'
import { Swap as SwapEntity } from '../../../generated/schema'

export function handleSwap(event: Swap): void {
  const trade = new SwapEntity(
    event.transaction.hash
      .toHexString()
      .concat('-')
      .concat(event.logIndex.toString()),
  )
  trade.transaction = event.transaction.hash.toHexString()
  trade.timestamp = event.block.timestamp
  trade.inputToken = event.params.inToken
  trade.outputToken = event.params.outToken
  trade.origin = event.transaction.from
  trade.inputAmount = event.params.amountIn
  trade.outputAmount = event.params.amountOut
  trade.logIndex = event.logIndex
  trade.save()
}
