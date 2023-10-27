import { getMazeRunnerAddress } from './ConfigFileReader'

const RETRY_COUNT = 20
const INTERVAL = 500

let mazeAddress

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export async function getCurrentCommand () {
  if (!mazeAddress) {
    mazeAddress = await getMazeRunnerAddress()
  }

  const url = `http://${mazeAddress}/command`
  console.error(`[BugsnagPerformance] Fetching command from ${url}`)

  let retries = 0

  while (retries++ < RETRY_COUNT) {
    try {
      const response = await fetch(url)
      const command = await response.json()

      // keep polling until a scenario command is received
      if (command.action !== 'noop') {
        console.error(`[BugsnagPerformance] Received command from maze runner: ${JSON.stringify(command)}`)

        return command
      }
    } catch (err) {
      console.error(`[BugsnagPerformance] Error fetching command from maze runner: ${err.message}`, err)
    }

    console.error(`[BugsnagPerformance] ${RETRY_COUNT - retries} retries remaining...`)

    await delay(INTERVAL)
  }

  throw new Error('Retry limit exceeded, giving up...')
}
