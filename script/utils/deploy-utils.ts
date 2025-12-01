import { exec as execCallback } from 'child_process'
import * as util from 'util'

import * as dotenv from 'dotenv'

import { prepare } from './prepare-network'
import { Argv } from './argv'

const exec = util.promisify(execCallback)

const buildGoldskyDeployCommand = async (
  network: string,
  gitHashString: string,
): Promise<string> => {
  try {
    await exec('goldsky --version')
  } catch (e) {
    console.log(
      'Error: Goldsky CLI is not installed. Please install it and try again.',
    )
    process.exit(1)
  }

  const subgraphName = `v2-subgraph-${network}/${gitHashString}`
  return `goldsky subgraph deploy ${subgraphName} --path .`
}

const buildAlchemyDeployCommand = (
  network: string,
  gitHashString: string,
): string => {
  dotenv.config()
  if (!process.env.ALCHEMY_DEPLOY_KEY) {
    throw new Error('ALCHEMY_DEPLOY_KEY must be set')
  }
  const deployKey = process.env.ALCHEMY_DEPLOY_KEY
  return `graph deploy v2-subgraph-${network} --version-label ${gitHashString} --node https://subgraphs.alchemy.com/api/subgraphs/deploy --deploy-key ${deployKey} --ipfs https://ipfs.satsuma.xyz`
}

const buildOrmiDeployCommand = (
  network: string,
  gitHashString: string,
): string => {
  dotenv.config()
  if (!process.env.ORMI_DEPLOY_KEY) {
    throw new Error('ORMI_DEPLOY_KEY must be set')
  }
  const deployKey = process.env.ORMI_DEPLOY_KEY
  return `graph deploy v2-subgraph-${network} --version-label ${gitHashString} --node https://api.subgraph.ormilabs.com/deploy --deploy-key ${deployKey} --ipfs https://api.subgraph.ormilabs.com/ipfs`
}

const buildSentioDeployCommand = (
  network: string,
  gitHashString: string,
): string => {
  dotenv.config()
  if (!process.env.SENTIO_DEPLOY_KEY) {
    throw new Error('SENTIO_DEPLOY_KEY must be set')
  }
  const deployKey = process.env.SENTIO_DEPLOY_KEY
  return `graph deploy v2-subgraph-${network} --version-label ${gitHashString} --node https://app.sentio.xyz/api/v1/graph-node --deploy-key ${deployKey} --ipfs https://app.sentio.xyz/api/v1/ipfs`
}

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

  const { stdout, stderr } = await exec(`graph build`)
  console.log(stdout)
  console.log(stderr)
}

export const deploy = async (argv: Argv): Promise<void> => {
  try {
    await exec('git diff-index --quiet HEAD -- && git diff --quiet || (exit 1)')
  } catch (e) {
    console.log(
      'Error: You have uncommitted changes. Please commit your changes and try again.',
    )
    process.exit(1)
  }

  const { stdout: gitHash } = await exec('git rev-parse --short HEAD')
  const gitHashString = gitHash.toString().trim()
  let command = ''
  if (argv?.goldsky) {
    command = await buildGoldskyDeployCommand(argv.network, gitHashString)
  } else if (argv?.alchemy) {
    command = buildAlchemyDeployCommand(argv.network, gitHashString)
  } else if (argv?.ormi) {
    command = buildOrmiDeployCommand(argv.network, gitHashString)
  } else if (argv?.sentio) {
    command = buildSentioDeployCommand(argv.network, gitHashString)
  }

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
