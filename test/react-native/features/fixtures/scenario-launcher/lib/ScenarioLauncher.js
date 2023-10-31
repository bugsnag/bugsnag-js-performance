import { AppRegistry } from 'react-native'
import { getCurrentCommand } from './CommandRunner'
import * as Scenarios from '../scenarios'
import { REACT_APP_SCENARIO_NAME, REACT_APP_ENDPOINT, REACT_APP_API_KEY } from '@env'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import { FileSystem, Dirs } from 'react-native-file-access'

const isTurboModuleEnabled = () => global.__turboModuleProxy != null

const PERSISTED_STATE_VERSION = 1
const PERSISTED_STATE_DIRECTORY = `${Dirs.CacheDir}/bugsnag-performance-react-native/v${PERSISTED_STATE_VERSION}`
const PERSISTED_STATE_PATH = `${PERSISTED_STATE_DIRECTORY}/persisted-state.json`

async function runScenario (rootTag, scenarioName, apiKey, endpoint) {
  console.error(`[BugsnagPerformance] Launching scenario: ${scenarioName}`)
  const scenario = Scenarios[scenarioName]

  BugsnagPerformance.start({
    apiKey,
    endpoint,
    networkRequestCallback (requestInfo) {
      // ignore requests to the maze runner command endpoint
      if (requestInfo.url.endsWith('/command')) {
        console.error(`[BugsnagPerformance] ignoring request to ${requestInfo.url}`)
        return null
      }

      return requestInfo
    },
    ...scenario.config
  })

  const appParams = { rootTag }
  if (isTurboModuleEnabled()) {
    appParams.fabric = true
    appParams.initialProps = { concurrentRoot: true }
  }

  AppRegistry.registerComponent(scenarioName, () => scenario.App)
  AppRegistry.runApplication(scenarioName, appParams)
}

async function writePersistedStateFile (contents) {
  if (!await FileSystem.exists(PERSISTED_STATE_DIRECTORY)) {
    console.error(`[BugsnagPerformance] creating persisted state directory: ${PERSISTED_STATE_DIRECTORY}`)
    await FileSystem.mkdir(PERSISTED_STATE_DIRECTORY)
  }

  console.error(`[BugsnagPerformance] writing to: ${PERSISTED_STATE_PATH}`)

  await FileSystem.writeFile(
    PERSISTED_STATE_PATH,
    JSON.stringify(contents)
  )

  console.error(`[BugsnagPerformance] finished writing to: ${PERSISTED_STATE_PATH}`)
}

async function setSamplingProbability (value, time = Date.now()) {
  await writePersistedStateFile({
    'sampling-probability': { value, time }
  })
}

async function setDeviceId (deviceId) {
  await writePersistedStateFile({ 'device-id': deviceId })
}

export async function launchScenario (rootTag, clearPersistedData = true) {
  if (clearPersistedData && await FileSystem.exists(PERSISTED_STATE_PATH)) {
    console.error(`[BugsnagPerformance] Clearing persisted data at path: ${PERSISTED_STATE_PATH}`)
    await FileSystem.unlink(PERSISTED_STATE_PATH)
  }

  let command

  if (REACT_APP_SCENARIO_NAME && REACT_APP_API_KEY) {
    command = {
      action: 'run-scenario',
      scenario_name: REACT_APP_SCENARIO_NAME,
      api_key: REACT_APP_API_KEY,
      endpoint: REACT_APP_ENDPOINT
    }
  } else {
    command = await getCurrentCommand()
  }

  switch (command.action) {
    case 'run-scenario':
      return await runScenario(
        rootTag,
        command.scenario_name,
        command.api_key,
        command.endpoint
      )

    case 'set-sampling-probability-to-0':
      await setSamplingProbability(0)

      return await launchScenario(rootTag, false)

    case 'set-device-id':
      await setDeviceId('c1234567890abcdefghijklmnop')

      return await launchScenario(rootTag, false)

    case 'set-invalid-sampling-probability':
      await setSamplingProbability(0, 12345)

      return await launchScenario(rootTag, false)

    case 'set-invalid-device-id':
      await setDeviceId('this is not a valid device ID')

      return await launchScenario(rootTag, false)

    default:
      throw new Error(`Unknown action '${command.action}'`)
  }
}
