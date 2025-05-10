import { exec as execCallback } from 'child_process'
import * as util from 'util'

import { prepare } from './prepare-network'

const exec = util.promisify(execCallback)

const codegen = async (): Promise<void> => {
  const { stdout, stderr } = await exec(`graph codegen subgraph.yaml`)
  console.log(stdout)
  console.log(stderr)
}

export const build = async (network: string): Promise<void> => {
  console.log(`Building subgraph for ${network}`)
  console.log(`\n Copying constants & templates for ${network} \n`)
  await prepare(network)
  console.log(`\n Generating manifest for ${network} subgraph \n`)
  await exec(
    `cross-env mustache config/${network}/config.json subgraph.template.yaml > subgraph.yaml`,
  )
  await codegen()

  const { stdout, stderr } = await exec(`graph build --network ${network}`)
  console.log(stdout)
  console.log(stderr)
}

export const deploy = async (network: string): Promise<void> => {
  try {
    await exec('git diff-index --quiet HEAD -- && git diff --quiet || (exit 1)')
  } catch (e) {
    console.log(
      'Error: You have uncommitted changes. Please commit your changes and try again.',
    )
    process.exit(1)
  }

  try {
    await exec('goldsky --version')
  } catch (e) {
    console.log(
      'Error: Goldsky CLI is not installed. Please install it and try again.',
    )
    process.exit(1)
  }

  const { stdout: gitHash } = await exec('git rev-parse --short HEAD')
  const gitHashString = gitHash.toString().trim()
  const subgraphName = `v2-subgraph-${network}/${gitHashString}`
  const command = `goldsky subgraph deploy ${subgraphName} --path .`

  try {
    console.log(command)
    const { stdout, stderr } = await exec(command)
    if (stderr.includes('Deployment failed')) {
      console.error(stderr)
    }
    console.log(stdout)
  } catch (e) {
    console.log(e.stdout)
    console.log(e.stderr)
    console.log('Error: Failed to deploy subgraph. Please try again.')
    process.exit(1)
  }
}
