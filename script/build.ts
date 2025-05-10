import yargs from 'yargs'

import { build, deploy } from './utils/deploy-utils'
import {
  validateDeploymentEnvironment,
  validateNetwork,
} from './utils/prepare-network'

async function main(): Promise<void> {
  const argv = yargs(process.argv.slice(2))
    .option('network', {
      alias: 'n',
      description: 'Network to build for',
      type: 'string',
      demandOption: true,
    })
    .option('deploy', {
      alias: 'd',
      description: 'Deploy the subgraph',
      type: 'boolean',
      default: false,
    })
    .help().argv
  validateNetwork(argv.network)
  await build(argv.network)
  if (argv.d || argv.deploy) {
    await deploy(argv.network)
  }
}

main()
