import { getMazeRunnerAddress as readMazeRunnerAddress, FALLBACK_ADDRESS } from './ConfigFileReader'

const DEFAULT_RETRY_COUNT = 20
const INTERVAL = 500

// On Android maze runner may push the config file to /data/local/tmp, which is
// outside the app sandbox and so survives reinstalls. The app can therefore start
// up holding an address left behind by a previous session. That address may be
// dead, or - since agents publish maze runner on a port range - may even be a
// live but unrelated maze runner, which answers 'noop' forever. So keep
// re-reading the config file until a real command arrives, rather than trusting
// the address we started with.
const POLLS_BETWEEN_REREADS = 8

// a dead address gives no response and no error - the connection simply stalls
// until the OS gives up, which is far longer than the scenario has. Without this
// the poll loop below never runs a second time and nothing is ever logged
const REQUEST_TIMEOUT = 5000

let mazeAddress
let lastCommandUuid

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export const getMazeRunnerAddress = async () => {
  if (!mazeAddress) {
    mazeAddress = await readMazeRunnerAddress()
  }
  return mazeAddress
}

const fetchWithTimeout = async url => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function getCurrentCommand (allowedRetries = DEFAULT_RETRY_COUNT) {
  if (allowedRetries <= 0) {
    throw new Error(`allowedRetries must be a number >0, got '${allowedRetries}'`)
  }

  await getMazeRunnerAddress()

  console.error(`[BugsnagPerformance] Fetching command from http://${mazeAddress}/command`)

  let retries = 0
  let pollsSinceReread = 0

  while (retries++ < allowedRetries) {
    const lastCommand = lastCommandUuid || ''
    const url = `http://${mazeAddress}/command?after=${lastCommand}`

    try {
      const response = await fetchWithTimeout(url)
      const text = await response.text()
      console.error(`[BugsnagPerformance] Response from maze runner: ${text}`)

      const command = JSON.parse(text)
      lastCommandUuid = command.uuid

      // keep polling until a scenario command is received
      if (command.action !== 'noop') {
        console.error(`[BugsnagPerformance] Received command from maze runner: ${JSON.stringify(command)}`)

        return command
      }
    } catch (err) {
      console.error(`[BugsnagPerformance] Error fetching command from maze runner: ${err.message}`, err)
    }

    // we have not been given a scenario yet, so the address we hold may be stale
    // whether or not it is answering - re-read the config file periodically until
    // maze runner tells us what to run
    if (++pollsSinceReread >= POLLS_BETWEEN_REREADS) {
      pollsSinceReread = 0

      const currentAddress = await readMazeRunnerAddress(0)

      if (currentAddress !== mazeAddress && currentAddress !== FALLBACK_ADDRESS) {
        console.error(`[BugsnagPerformance] maze runner address changed from '${mazeAddress}' to '${currentAddress}', retrying there`)
        mazeAddress = currentAddress
        lastCommandUuid = undefined
      }
    }

    console.error(`[BugsnagPerformance] ${allowedRetries - retries} retries remaining...`)

    await delay(INTERVAL)
  }

  throw new Error('Retry limit exceeded, giving up...')
}
