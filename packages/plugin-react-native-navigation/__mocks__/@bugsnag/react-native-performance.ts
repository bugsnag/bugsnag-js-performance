import type { Configuration, Plugin } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'

const plugins: Array<Plugin<Configuration>> = []

const BugsnagPerformance = {
  start: jest.fn((configuration: ReactNativeConfiguration) => {
    plugins.length = 0
    configuration.plugins?.forEach(plugin => plugins.push(plugin))
  }),
  getPlugin: jest.fn((Constructor) => {
    for (const plugin of plugins) {
      if (plugin instanceof Constructor) {
        return plugin
      }
    }
  })
}

export default BugsnagPerformance
