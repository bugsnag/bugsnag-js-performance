import { AppRegistry } from 'react-native'
import { getCurrentCommand } from './CommandRunner'
import * as Scenarios from './scenarios/Scenarios'
import { REACT_APP_SCENARIO_NAME, REACT_APP_ENDPOINT, REACT_APP_API_KEY } from '@env'

export const launchScenario = async (rootTag) => {
  let command
  if (REACT_APP_SCENARIO_NAME && REACT_APP_API_KEY) {
    command = { scenario_name: REACT_APP_SCENARIO_NAME, api_key: REACT_APP_API_KEY, endpoint: REACT_APP_ENDPOINT }
  } else {
    command = await getCurrentCommand()
  }

  const scenario = Scenarios[command.scenario_name]
  AppRegistry.registerComponent(command.scenario_name, () => scenario(command.endpoint, command.api_key))
  AppRegistry.runApplication(command.scenario_name, { initialProps: {}, rootTag })
}
