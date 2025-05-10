import yargs from 'yargs'

const fs = require('fs')

async function main(): Promise<void> {
  const argv = yargs(process.argv.slice(2))
    .option('subgraph', {
      alias: 's',
      description: 'Subgraph to build for fetching token address',
      type: 'string',
      demandOption: true,
    })
    .help().argv

  const response = await fetch(argv.subgraph, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `{
        tokens {
          id
          name
          symbol
          decimals
        }
      }`,
    }),
  })
  const {
    data: { tokens },
  } = (await response.json()) as {
    data: {
      tokens: {
        id: string
        name: string
        symbol: string
        decimals: number
      }[]
    }
  }

  const text =
    '[' +
    tokens
      .map((token) => {
        return `{address: Address.fromString('${token.id.toLowerCase()}'), symbol: '${
          token.symbol
        }', name: '${token.name}', decimals: BigInt.fromI32(${
          token.decimals
        }),}`
      })
      .join(',\n') +
    ']'

  fs.writeFileSync('./tokens.txt', text)
  console.log('tokens.txt generated successfully')
}

main()
