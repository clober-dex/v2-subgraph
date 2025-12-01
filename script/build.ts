import yargs from 'yargs'

import { build, deploy } from './utils/deploy-utils'
import { validateNetwork } from './utils/prepare-network'

async function main(): Promise<void> {
  const argv = yargs(process.argv.slice(2))
    .option('network', {
      alias: 'n',
      description: 'Network to build for',
      type: 'string',
      demandOption: true,
    })
    .option('goldsky', {
      description: 'Deploy the subgraph to Goldsky',
      type: 'boolean',
      default: false,
    })
    .option('alchemy', {
      description: 'Deploy the subgraph to Alchemy',
      type: 'boolean',
      default: false,
    })
    .option('ormi', {
      description: 'Deploy the subgraph to Ormi',
      type: 'boolean',
      default: false,
    })
    .help().argv
  const { doDeploy } = validateNetwork(argv)
  await build(argv.network)
  if (doDeploy) {
    await deploy(argv)
  }
}

main()
