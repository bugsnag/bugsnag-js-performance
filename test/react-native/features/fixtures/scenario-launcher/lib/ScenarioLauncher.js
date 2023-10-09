import { AppRegistry } from 'react-native'
import { getCurrentCommand } from './CommandRunner'
import * as Scenarios from '../scenarios'
import { REACT_APP_SCENARIO_NAME, REACT_APP_ENDPOINT, REACT_APP_API_KEY } from '@env'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import { FileSystem, Dirs } from 'react-native-file-access'

const isTurboModuleEnabled = () => global.__turboModuleProxy != null

const PERSISTED_STATE_VERSION = 1
const PERSISTED_STATE_PATH = `${Dirs.CacheDir}/bugsnag-performance-react-native/v${PERSISTED_STATE_VERSION}/persisted-state.json`

export const launchScenario = async (rootTag) => {
  let command

  if (REACT_APP_SCENARIO_NAME && REACT_APP_API_KEY) {
    command = { scenario_name: REACT_APP_SCENARIO_NAME, api_key: REACT_APP_API_KEY, endpoint: REACT_APP_ENDPOINT }
  } else {
    command = await getCurrentCommand()
  }

  if (await FileSystem.exists(PERSISTED_STATE_PATH)) {
    console.error(`[BugsnagPerformance] Clearing persisted data at path: ${PERSISTED_STATE_PATH}`)
    await FileSystem.unlink(PERSISTED_STATE_PATH)
  }

  console.error(`[BugsnagPerformance] Launching scenario: ${command.scenario_name}`)
  const scenario = Scenarios[command.scenario_name]

  BugsnagPerformance.start({
    apiKey: command.api_key,
    endpoint: command.endpoint,
    ...scenario.config
  })

  const appParams = { rootTag }
  if (isTurboModuleEnabled()) {
    appParams.fabric = true
    appParams.initialProps = { concurrentRoot: true }
  }

  AppRegistry.registerComponent(command.scenario_name, () => scenario.App)
  AppRegistry.runApplication(command.scenario_name, appParams)
}
