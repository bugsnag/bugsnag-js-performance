import { AppRegistry } from 'react-native'
import { readCommand } from './CommandRunner'
import * as Scenarios from './scenarios/Scenarios'

export const launchScenario = async (appName) => {
  const command = await readCommand()
  const scenario = Scenarios[command.scenario_name]
  AppRegistry.registerComponent(appName, () => scenario(command.endpoint))
}
