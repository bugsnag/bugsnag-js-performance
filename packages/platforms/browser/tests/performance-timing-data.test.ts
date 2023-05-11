import createPerformanceTimingSource, { type PerformanceTimingData } from '../lib/performance-timing-data'
import { PerformanceObserverManager } from '@bugsnag/js-performance-test-utilities'

describe('getPerformanceTimingData', () => {
  it('resolves to a PerformanceTimingData object using PerformanceObserver', () => {
    expect.assertions(1)

    const manager = new PerformanceObserverManager()
    const getPerformanceTimingData = createPerformanceTimingSource(
      manager.createPerformanceObserverFakeClass(),
      performance
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

  it('resolves to a PerformanceTimingData object using performance.timing', async () => {
    const performanceTiming = {
      connectStart: 100,
      connectEnd: 200,
      domainLookupStart: 300,
      domainLookupEnd: 400,
      domComplete: 500,
      domContentLoadedEventStart: 600,
      domContentLoadedEventEnd: 700,
      domInteractive: 800,
      fetchStart: 900,
      loadEventStart: 1000,
      loadEventEnd: 1100,
      redirectStart: 1200,
      redirectEnd: 1300,
      responseStart: 1400,
      responseEnd: 1500,
      requestStart: 1600,
      secureConnectionStart: 1700,
      unloadEventStart: 1800,
      unloadEventEnd: 1900,
      workerStart: 2000,
      domLoading: 2100,
      navigationStart: 100,
      // eslint-disable-next-line compat/compat
      toJSON () { return Object.fromEntries(Object.entries(performanceTiming)) }
    }

    const manager = new PerformanceObserverManager()
    const getPerformanceTimingData = createPerformanceTimingSource(
      manager.createPerformanceObserverFakeClass(null),
      { timing: performanceTiming }
    )

    const data = await getPerformanceTimingData()

    expect(data).toMatchObject({
      connectStart: 0,
      connectEnd: 100,
      domainLookupStart: 200,
      domainLookupEnd: 300,
      domComplete: 400,
      domContentLoadedEventStart: 500,
      domContentLoadedEventEnd: 600,
      domInteractive: 700,
      fetchStart: 800,
      loadEventStart: 900,
      loadEventEnd: 1000,
      redirectStart: 1100,
      redirectEnd: 1200,
      responseStart: 1300,
      responseEnd: 1400,
      requestStart: 1500,
      secureConnectionStart: 1600,
      unloadEventStart: 1700,
      unloadEventEnd: 1800
    })
  })
})
