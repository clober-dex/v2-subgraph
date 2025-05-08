import { exec as execCallback } from 'child_process'
import * as util from 'util'

import { prepare } from './prepare-network'

const exec = util.promisify(execCallback)

export const build = async (network: string): Promise<void> => {
  console.log(`Building subgraph for ${network}`)
  console.log(`\n Copying constants & templates for ${network} \n`)
  await prepare(network)
  console.log(`\n Generating manifest for ${network} subgraph \n`)
  await exec(
    `cross-env mustache config/${network}/config.json subgraph.template.yaml > subgraph.yaml`,
  )
  const { stdout, stderr } = await exec(`graph codegen subgraph.yaml`)
  console.log(stdout)
  console.log(stderr)
}
