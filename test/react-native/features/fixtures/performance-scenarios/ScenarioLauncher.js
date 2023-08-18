import { AppRegistry } from 'react-native'
import { getCommand } from './CommandRunner'
import * as Scenarios from './scenarios/Scenarios'

export const launchScenario = async (rootTag) => {
  const command = await getCommand()
  const scenario = Scenarios[command.scenario_name]
  AppRegistry.registerComponent('scenario', () => scenario(command.endpoint))
  AppRegistry.runApplication('scenario', { initialProps: {}, rootTag })
}
