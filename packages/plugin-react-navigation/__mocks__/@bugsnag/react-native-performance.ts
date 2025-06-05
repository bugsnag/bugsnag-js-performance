import { createTestClient, IncrementingClock, MockReactNativeSpanFactory } from '@bugsnag/js-performance-test-utilities'
import { platformExtensions } from '@bugsnag/react-native-performance/lib/platform-extensions'

// const plugins: Array<Plugin<ReactNativeConfiguration>> = []
// const spanFactory = new MockReactNativeSpanFactory()

// const BugsnagPerformance = {
//   spanFactory,
//   start: jest.fn((configuration: ReactNativeConfiguration) => {
//     plugins.length = 0
//     configuration.plugins?.forEach(plugin => plugins.push(plugin))
//   }),
//   getPlugin: jest.fn((Constructor) => {
//     for (const plugin of plugins) {
//       if (plugin instanceof Constructor) {
//         return plugin
//       }
//     }
//   }),
//   startNavigationSpan: jest.fn((routeName: string, spanOptions?: any) => {
//     const span = spanFactory.startNavigationSpan(routeName, spanOptions)
//     return spanFactory.toPublicApi(span)
//   })
// }

const clock = new IncrementingClock()

const BugsnagPerformance = createTestClient({
  clock,
  spanFactory: MockReactNativeSpanFactory,
  platformExtensions: (spanFactory, spanContextStorage) => {
    const reactNativeExtensions = platformExtensions(0, clock, spanFactory as unknown as MockReactNativeSpanFactory, spanContextStorage)

    return {
      ...reactNativeExtensions,
      spanFactory
    }
  }
})

// Spy on all methods
Object.keys(BugsnagPerformance).forEach(key => {
  const client = BugsnagPerformance as any
  if (typeof client[key] === 'function') {
    jest.spyOn(client, key)
  }
})

export default BugsnagPerformance
