import { getMazeRunnerAddress as readMazeRunnerAddress, FALLBACK_ADDRESS } from './ConfigFileReader'

// number of consecutive polls of a single maze runner address that can fail to
// return a command before we give up on that address
const DEFAULT_RETRY_COUNT = 20

// time between polls when maze runner answers but has no command for us yet
const INTERVAL = 500

// time between polls when the address does not answer at all - there is no
// point hammering a dead address, and the delay gives maze runner time to push
// a fresh config file if the one we read was stale
const ERROR_INTERVAL = 2000

// On Android maze runner pushes the config file to /data/local/tmp, which is
// outside the app sandbox and so survives reinstalls - and the device itself is
// shared with other test runs. The app can therefore start up holding an
// address left behind by a previous session. That address may be dead, or -
// since agents publish maze runner on a port range - may even be a live but
// unrelated maze runner, which answers 'noop' forever. So keep re-reading the
// config file until a real command arrives, rather than trusting the address
// we started with: immediately whenever a poll fails, and periodically while
// the address is answering 'noop'.
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

// re-read the config file and switch to the address it holds if it has changed.
// Returns true if the address changed
const refreshMazeRunnerAddress = async () => {
  const currentAddress = await readMazeRunnerAddress(0)

  if (currentAddress === mazeAddress || currentAddress === FALLBACK_ADDRESS) {
    return false
  }

  console.error(`[BugsnagPerformance] maze runner address changed from '${mazeAddress}' to '${currentAddress}', retrying there`)
  mazeAddress = currentAddress
  lastCommandUuid = undefined

  return true
}

export async function getCurrentCommand (allowedRetries = DEFAULT_RETRY_COUNT) {
  if (allowedRetries <= 0) {
    throw new Error(`allowedRetries must be a number >0, got '${allowedRetries}'`)
  }

  await getMazeRunnerAddress()

  console.error(`[BugsnagPerformance] Fetching command from http://${mazeAddress}/command`)

  let retries = 0
  let pollsSinceReread = 0

  while (retries < allowedRetries) {
    const lastCommand = lastCommandUuid || ''
    const url = `http://${mazeAddress}/command?after=${lastCommand}`
    let failed = false

    try {
      const response = await fetchWithTimeout(url)
      const text = await response.text()
      console.error(`[BugsnagPerformance] Response from maze runner: ${text}`)

      if (!response.ok) {
        // maze runner answers 400 when it no longer knows the uuid we are
        // following on from, e.g. because its command list was reset while
        // this process kept running. Start again from the front of the queue
        // rather than repeating a request that can never succeed
        if (response.status === 400 && lastCommandUuid) {
          console.error(`[BugsnagPerformance] maze runner does not recognise command '${lastCommandUuid}', restarting from the first command`)
          lastCommandUuid = undefined
        }

        throw new Error(`unexpected ${response.status} response: ${text}`)
      }

      const command = JSON.parse(text)

      // keep polling until a scenario command is received. A 'noop' has no uuid,
      // so the cursor must not be touched here: clearing it would make the next
      // poll ask for everything 'after' nothing, and maze runner would replay
      // the very first command of the scenario
      if (command.action !== 'noop') {
        lastCommandUuid = command.uuid
        console.error(`[BugsnagPerformance] Received command from maze runner: ${JSON.stringify(command)}`)

        return command
      }
    } catch (err) {
      failed = true
      console.error(`[BugsnagPerformance] Error fetching command from maze runner at ${mazeAddress}: ${err.message}`, err)
    }

    // we have not been given a scenario yet, so the address we hold may be stale
    // whether or not it is answering - re-read the config file until maze runner
    // tells us what to run
    if (failed || ++pollsSinceReread >= POLLS_BETWEEN_REREADS) {
      pollsSinceReread = 0

      if (await refreshMazeRunnerAddress()) {
        // the retry budget is per address: a stale address must not use up the
        // retries the real one needs
        retries = 0
        continue
      }
    }

    retries++
    console.error(`[BugsnagPerformance] ${allowedRetries - retries} retries remaining for ${mazeAddress}...`)

    await delay(failed ? ERROR_INTERVAL : INTERVAL)
  }

  throw new Error(`Retry limit exceeded: no command received from maze runner at http://${mazeAddress}/command after ${allowedRetries} attempts, giving up...`)
}
