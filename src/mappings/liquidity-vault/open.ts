import { Open } from '../../../generated/Rebalancer/Rebalancer'
import {
  getBookOrLog,
  getOrCreateTransaction,
} from '../../common/entity-getters'
import { Pool } from '../../../generated/schema'
import { ZERO_BD, ZERO_BI } from '../../common/constants'

export function handlePoolOpen(event: Open): void {
  const bookA = getBookOrLog(event.params.bookIdA.toString(), 'OPEN')
  const bookB = getBookOrLog(event.params.bookIdB.toString(), 'OPEN')
  if (bookA && bookB) {
    const pool = new Pool(event.params.key)
    pool.salt = event.params.salt
    pool.strategy = event.params.strategy
    pool.createdAtTimestamp = event.block.timestamp
    pool.createdAtBlockNumber = event.block.number
    pool.createdAtTransaction = getOrCreateTransaction(event).id
    pool.initialTokenAAmount = ZERO_BI
    pool.initialTokenBAmount = ZERO_BI
    pool.initialTotalSupply = ZERO_BI
    pool.initialLPPriceUSD = ZERO_BD
    pool.tokenA = bookA.quote
    pool.tokenB = bookB.quote
    pool.bookA = bookA.id
    pool.bookB = bookB.id

    pool.oraclePrice = ZERO_BD
    pool.totalSupply = ZERO_BI
    pool.liquidityA = ZERO_BI
    pool.liquidityB = ZERO_BI
    pool.priceA = ZERO_BD
    pool.priceARaw = ZERO_BI
    pool.tickA = ZERO_BI
    pool.priceB = ZERO_BD
    pool.priceBRaw = ZERO_BI
    pool.tickB = ZERO_BI
    pool.volumeTokenA = ZERO_BD
    pool.volumeTokenB = ZERO_BD
    pool.volumeUSD = ZERO_BD
    pool.spreadProfitUSD = ZERO_BD

    // bind book to pool
    bookA.pool = pool.id
    bookB.pool = pool.id

    pool.save()
    bookA.save()
    bookB.save()
  }
}
