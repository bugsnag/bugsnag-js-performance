import { getMazeRunnerAddress } from './ConfigFileReader'

const RETRY_COUNT = 20
const INTERVAL = 500

let mazeAddress
let retries = 0

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const fetchCommand = async (url) => {
  // poll periodically for the command - if we don't get one after 10 seconds, give up
  try {
    const response = await fetch(url)
    const command = await response.json()
    
    // keep polling until a scenario command is received
    if (command.action !== 'noop') {
      console.error(`[BugsnagPerformance] Received command from maze runner: ${JSON.stringify(command)}`)
      return command
    } 
    else if (retries < RETRY_COUNT) {
      retries++
      console.error(`[BugsnagPerformance] Received a noop command from maze runner, ${RETRY_COUNT - retries} retries remaining...`)
      
      await delay(INTERVAL)
      return fetchCommand(url)
    }
    
    throw new Error('Retry limit exceeded, giving up...')
    
  } catch (err) {
    console.error(`[BugsnagPerformance] Error fetching command from maze runner: ${err.message}`, err)

    if(retries < RETRY_COUNT) {
      retries++
      console.error(`[BugsnagPerformance] ${RETRY_COUNT - retries} retries remaining...`)

      await delay(INTERVAL)
      return fetchCommand(url)
    }

    throw err
  }
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
