import * as path from 'path'
import * as process from 'process'

import * as fsExtra from 'fs-extra'

export enum NETWORK {
  MONAD_TESTNET = 'monad-testnet',
}

const CHAIN_CONSTANTS_FILE_NAME = 'chain.ts'

export function validateNetwork(network: string): void {
  if (!network) {
    console.error('no network parameter passed')
    process.exit(-1)
  }

  if (
    !Object.values(NETWORK)
      .map((n) => n.toString())
      .includes(network)
  ) {
    console.error(
      'invalid network parameter passed, pass either: ',
      ...Object.values(NETWORK),
    )
    process.exit(-1)
  }
}

export async function prepare(network: string): Promise<void> {
  try {
    console.log(`preparing config for ${network} subgraph`)
    const chainConstantsFilePath = path.join(
      __dirname + '/../../config/' + network + '/' + CHAIN_CONSTANTS_FILE_NAME,
    )
    const chainConstantsOutputPath = path.join(
      __dirname + '/../../src/common/' + CHAIN_CONSTANTS_FILE_NAME,
    )

    console.log(
      'chain constants path:',
      chainConstantsFilePath,
      ' to:',
      chainConstantsOutputPath,
    )

    fsExtra.copySync(chainConstantsFilePath, chainConstantsOutputPath)
  } catch (error) {
    console.error(error)
  }
}
