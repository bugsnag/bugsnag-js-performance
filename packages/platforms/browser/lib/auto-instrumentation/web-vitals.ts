export class WebVitalsManager {
  ttfb = 0

  constructor (PerformanceObserverClass: typeof PerformanceObserver) {
    new PerformanceObserverClass((entryList) => {
      const [pageNav] = entryList.getEntriesByType('navigation')

      // @ts-expect-error responseStart does not exist
      this.ttfb = pageNav.responseStart
    }).observe({
      type: 'navigation',
      buffered: true
    })
  }
}
