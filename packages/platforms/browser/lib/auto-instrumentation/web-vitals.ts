export class WebVitalsManager {
  ttfb = 0

  constructor (PerformanceObserverClass: typeof PerformanceObserver) {
    const observer = new PerformanceObserverClass((entryList) => {
      const [pageNav] = entryList.getEntriesByType('navigation')

      // @ts-expect-error TypeScript unaware of responseStart on pageNav
      this.ttfb = pageNav.responseStart
    })

    observer?.observe?.({
      type: 'navigation',
      buffered: true
    })
  }
}
