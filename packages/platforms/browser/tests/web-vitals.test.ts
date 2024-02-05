import { IncrementingClock, MockSpanFactory } from '@bugsnag/js-performance-test-utilities'
import { PerformanceFake, PerformanceObserverManager } from './utilities'
import { WebVitals } from '../lib/web-vitals'

describe('WebVitals', () => {
  it('does not throw when performance.getEntriesByType returns undefined', () => {
    expect(() => {
      const clock = new IncrementingClock('1970-01-01T00:00:00Z')
      const manager = new PerformanceObserverManager()
      const performance = new PerformanceFake()

      // @ts-expect-error overwrite getEntriesByType to return undefined
      performance.getEntriesByType = jest.fn(() => undefined)
      // @ts-expect-error overwrite getEntriesByName to return undefined
      performance.getEntriesByName = jest.fn(() => undefined)

      const webVitals = new WebVitals(performance, clock, manager.createPerformanceObserverFakeClass())
      const spanFactory = new MockSpanFactory()
      const span = spanFactory.startSpan('test span', {})
      webVitals.attachTo(span)
    }).not.toThrow()
  })
})
