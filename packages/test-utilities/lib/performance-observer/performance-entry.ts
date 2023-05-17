// https://w3c.github.io/timing-entrytypes-registry/#registry
export type PerformanceEntryType
  = 'mark'
  | 'measure'
  | 'navigation'
  | 'resource'
  | 'longtask'
  | 'paint'
  | 'element'
  | 'event'
  | 'first-input'
  | 'layout-shift'
  | 'largest-contentful-paint'

// https://w3c.github.io/performance-timeline/#dom-performanceentry
export interface PerformanceEntryFake {
  duration: number
  entryType: PerformanceEntryType
  name: string
  startTime: number

  toJSON: () => any
}

type RenderBlockingStatusType = 'blocking' | 'non-blocking'
type InitiatorType
  = 'navigation'
  | 'css'
  | 'script'
  | 'xmlhttprequest'
  | 'fetch'
  | 'beacon'
  | 'video'
  | 'audio'
  | 'track'
  | 'img'
  | 'image'
  | 'input'
  | 'a'
  | 'iframe'
  | 'frame'
  | 'other'
type DeliveryType = 'cache' | ''

// https://www.w3.org/TR/resource-timing/#dom-performanceresourcetiming
export interface PerformanceResourceTimingFake extends PerformanceEntryFake {
  entryType: 'resource'
  initiatorType: InitiatorType
  deliveryType: DeliveryType
  nextHopProtocol: string
  workerStart: number
  redirectStart: number
  redirectEnd: number
  fetchStart: number
  domainLookupStart: number
  domainLookupEnd: number
  connectStart: number
  connectEnd: number
  secureConnectionStart: number
  requestStart: number
  responseStart: number
  responseEnd: number
  transferSize: number
  encodedBodySize: number
  decodedBodySize: number
  responseStatus: number
  renderBlockingStatus: RenderBlockingStatusType
}

export type NavigationTimingType = 'navigate' | 'reload' | 'back_forward' | 'prerender'

// https://w3c.github.io/navigation-timing/#dom-performancenavigationtiming
export interface PerformanceNavigationTimingFake extends Omit<PerformanceResourceTimingFake, 'entryType'>, PerformanceEntryFake {
  entryType: 'navigation'
  unloadEventStart: number
  unloadEventEnd: number
  domInteractive: number
  domContentLoadedEventStart: number
  domContentLoadedEventEnd: number
  domComplete: number
  loadEventStart: number
  loadEventEnd: number
  type: NavigationTimingType
  redirectCount: number
}
