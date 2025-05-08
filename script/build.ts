import yargs from 'yargs'

import { build } from './utils/deploy-utils'
import { validateNetwork } from './utils/prepare-network'

async function main(): Promise<void> {
  const argv = yargs(process.argv.slice(2))
    .option('network', {
      alias: 'n',
      description: 'Network to build for',
      type: 'string',
      demandOption: true,
    })
    .help().argv
  validateNetwork(argv.network)
  await build(argv.network)
}

main()
