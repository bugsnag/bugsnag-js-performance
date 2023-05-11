import createPerformanceTimingSource, { type PerformanceTimingData } from '../lib/performance-timing-data'
import { PerformanceObserverManager } from '@bugsnag/js-performance-test-utilities'

describe('getPerformanceTimingData', () => {
  it('resolves to a PerformanceTimingData object', () => {
    expect.assertions(1)

    const manager = new PerformanceObserverManager()
    const getPerformanceTimingData = createPerformanceTimingSource(
      manager.createPerformanceObserverFakeClass()
    )

    const expected = {
      connectStart: 1,
      connectEnd: 2,
      domainLookupStart: 3,
      domainLookupEnd: 4,
      domComplete: 5,
      domContentLoadedEventStart: 6,
      domContentLoadedEventEnd: 7,
      domInteractive: 8,
      fetchStart: 9,
      loadEventStart: 10,
      loadEventEnd: 11,
      redirectStart: 12,
      redirectEnd: 13,
      responseStart: 14,
      responseEnd: 15,
      requestStart: 16,
      secureConnectionStart: 17,
      unloadEventStart: 18,
      unloadEventEnd: 19,
      workerStart: 20
    }

    const promise = getPerformanceTimingData()
      .then((data: PerformanceTimingData) => {
        expect(data).toMatchObject(expected)
      })

    const finishedEntry = manager.createPerformanceNavigationTimingFake(expected)
    manager.queueEntry(finishedEntry)
    manager.flushQueue()

    return promise
  })
})
