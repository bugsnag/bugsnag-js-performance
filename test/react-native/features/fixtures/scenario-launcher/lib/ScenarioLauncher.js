import BugsnagPerformance from '@bugsnag/react-native-performance'
import { AppRegistry } from 'react-native'
import * as Scenarios from '../scenarios'

export const launchScenario = (rootTag, command) => {
  console.error(`[BugsnagPerformance] Launching scenario: ${command.scenario_name}`)
  const scenario = Scenarios[command.scenario_name]

  BugsnagPerformance.start({
    apiKey: command.api_key,
    endpoint: command.endpoint,
    appName: 'com.bugsnag.reactnative.performance',
    ...scenario.config
  })

  AppRegistry.registerComponent(command.scenario_name, () => scenario.App)
  AppRegistry.runApplication(command.scenario_name, { initialProps: {}, rootTag })
}
