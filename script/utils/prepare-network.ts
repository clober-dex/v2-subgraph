import * as path from 'path'
import * as process from 'process'

import * as fsExtra from 'fs-extra'

import { Argv } from './argv'

export enum NETWORK {
  MONAD_TESTNET = 'monad-testnet',
  MONAD = 'monad',
  RISE_SEPOLIA = 'rise-sepolia',
  ARBITRUM_SEPOLIA = 'arbitrum-sepolia',
  BERACHAIN_MAINNET = 'berachain-mainnet',
  GIWA_SEPOLIA = 'giwa-sepolia',
}

const CHAIN_CONSTANTS_FILE_NAME = 'chain.ts'

export function validateDeploymentEnvironment(tag: string): void {
  const regex = /^\d+\.\d+\.\d+$/
  if (!regex.test(tag)) {
    console.error(
      'invalid deploy tag format, expected [number].[number].[number]',
    )
    process.exit(-1)
  }
}

export function validateNetwork(argv: Argv): {
  doDeploy: boolean
} {
  if (!argv.network) {
    console.error('no network parameter passed')
    process.exit(-1)
  }

  if (
    !Object.values(NETWORK)
      .map((n) => n.toString())
      .includes(argv.network)
  ) {
    console.error(
      'invalid network parameter passed, pass either: ',
      ...Object.values(NETWORK),
    )
    process.exit(-1)
  }

  if (argv.goldsky || argv.alchemy || argv.ormi || argv.sentio) {
    switch (argv.network) {
      case NETWORK.RISE_SEPOLIA:
        if (argv.alchemy) {
          console.error(`Alchemy deploy is not supported for ${argv.network}`)
          process.exit(-1)
        }
        break
    }
    return { doDeploy: true }
  }
  return { doDeploy: false }
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
