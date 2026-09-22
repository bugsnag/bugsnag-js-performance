import { getMazeRunnerAddress as readMazeRunnerAddress } from './configFileReader'

const DEFAULT_RETRY_COUNT = 30
const INTERVAL = 1000
const FETCH_TIMEOUT_MS = 5000

let mazeAddress
let lastCommandUuid

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Fetch with an explicit timeout to prevent hanging fetch calls on physical devices
 */
const fetchWithTimeout = async (url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

export const getMazeRunnerAddress = async (forceRefresh = false) => {
  if (!mazeAddress || forceRefresh || mazeAddress === 'localhost:9339') {
    const resolvedAddress = await readMazeRunnerAddress()
    if (resolvedAddress) {
      mazeAddress = resolvedAddress
    }
  }
  return mazeAddress
}

export async function getCurrentCommand (allowedRetries = DEFAULT_RETRY_COUNT) {
  if (allowedRetries <= 0) {
    throw new Error(`allowedRetries must be a number >0, got '${allowedRetries}'`)
  }

  let retries = 0

  while (retries++ < allowedRetries) {
    try {
      // Ensure we have the latest resolved maze address, refreshing if currently on fallback
      const currentAddress = await getMazeRunnerAddress(mazeAddress === 'localhost:9339')
      
      const normalizedAddress = currentAddress.startsWith('http://') || currentAddress.startsWith('https://')
        ? currentAddress
        : `http://${currentAddress}`

      const lastCommand = lastCommandUuid || ''
      const url = `${normalizedAddress}/command?after=${lastCommand}`

      console.error(`[BugsnagPerformance] Fetching command from ${url}`)

      const response = await fetchWithTimeout(url)

      if (response.ok) {
        const text = await response.text()
        console.error(`[BugsnagPerformance] Response from maze runner: ${text}`)

        const command = JSON.parse(text)
        if (command && command.uuid) {
          lastCommandUuid = command.uuid
        }

        // keep polling until a valid non-noop scenario command is received
        if (command && command.action !== 'noop') {
          console.error(`[BugsnagPerformance] Received command from maze runner: ${JSON.stringify(command)}`)
          return command
        }
      } else {
        console.error(`[BugsnagPerformance] HTTP ${response.status} ${response.statusText} received from ${url}`)
      }
    } catch (err) {
      console.error(`[BugsnagPerformance] Error fetching command from maze runner: ${err.message}`, err)
    }

    console.error(`[BugsnagPerformance] ${allowedRetries - retries} retries remaining...`)
    await delay(INTERVAL)
  }

  throw new Error('Retry limit exceeded, giving up...')
}