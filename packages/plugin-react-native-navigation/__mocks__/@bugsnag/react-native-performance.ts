import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import type { Plugin, Configuration, SpanFactory, SpanOptions } from '@bugsnag/core-performance'

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

// TODO: Remove this duplicate
export function createNavigationSpan <C extends Configuration> (spanFactory: SpanFactory<C>, routeName: string, spanOptions: SpanOptions) {
  spanOptions.isFirstClass = true
  const span = spanFactory.startSpan(`[Navigation]${routeName}`, spanOptions)
  span.setAttribute('bugsnag.span.category', 'navigation')
  span.setAttribute('bugsnag.navigation.route', routeName)
  return span
}
