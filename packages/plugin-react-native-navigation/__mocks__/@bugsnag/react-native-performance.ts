import { MockReactNativeSpanFactory, createTestClient, IncrementingClock } from '@bugsnag/js-performance-test-utilities'
import { createDefaultPlatformExtensions } from '@bugsnag/react-native-performance/lib/platform-extensions'

const clock = new IncrementingClock()

const BugsnagPerformance = createTestClient({
  clock,
  spanFactory: MockReactNativeSpanFactory,
  platformExtensions: (spanFactory, spanContextStorage) => {
    const reactNativeExtensions = createDefaultPlatformExtensions(0, clock, spanFactory as unknown as MockReactNativeSpanFactory, spanContextStorage)

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
