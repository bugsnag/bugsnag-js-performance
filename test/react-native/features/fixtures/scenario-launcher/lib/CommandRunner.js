import { getMazeRunnerAddress } from './ConfigFileReader'

const RETRY_COUNT = 20
const INTERVAL = 500

export let mazeAddress

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const fetchCommand = async (url) => {
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

const getCurrentCommand = async () => {
  if (!mazeAddress) {
    mazeAddress = await getMazeRunnerAddress()
  }

  const commandUrl = `http://${mazeAddress}/command`
  console.error(`[BugsnagPerformance] Fetching command from ${commandUrl}`)

  const command = await fetchCommand(commandUrl)
  return command
}

module.exports.getCurrentCommand = getCurrentCommand
