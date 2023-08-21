import { AppRegistry } from 'react-native'
import { getCurrentCommand } from './CommandRunner'
import * as Scenarios from './scenarios/Scenarios'

export const launchScenario = async (rootTag) => {
  const command = await getCurrentCommand()
  const scenario = Scenarios[command.scenario_name]
  AppRegistry.registerComponent('scenario', () => scenario(command.endpoint, command.apiKey))
  AppRegistry.runApplication('scenario', { initialProps: {}, rootTag })
}
