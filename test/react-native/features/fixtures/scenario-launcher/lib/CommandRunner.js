import { getMazeRunnerAddress } from './ConfigFileReader'
import { launchScenario } from './ScenarioLauncher'
import { REACT_APP_SCENARIO_NAME, REACT_APP_ENDPOINT, REACT_APP_API_KEY } from '@env'
import AsyncStorage from "@react-native-async-storage/async-storage"
import { delay } from './utils'

const RETRY_COUNT = 20
const INTERVAL = 500

let mazeAddress
let retries = 0

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

// run whatever command we get from command fetcher
export const commandRunner = async (rootTag) => {
  let command

  if (REACT_APP_SCENARIO_NAME && REACT_APP_API_KEY) {
    command = { action: 'run_scenario', scenario_name: REACT_APP_SCENARIO_NAME, api_key: REACT_APP_API_KEY, endpoint: REACT_APP_ENDPOINT }
  } else {
    command = await getCurrentCommand()
  }

  switch (command.action) {
    case 'run_scenario':
      launchScenario(rootTag, command)
      break
    case 'clear_data':
      AsyncStorage.clear()
      commandRunner(rootTag)
      break
    default:
      console.error(`[BugsnagPerformance] received unknown command ${command.action}`)
  }
}
