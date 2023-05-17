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

export function createPerformanceNavigationTimingFake (
  overrides: Partial<PerformanceNavigationTimingFake> = {}
): PerformanceNavigationTimingFake {
  return {
    duration: 0,
    entryType: 'navigation',
    name: 'http://localhost:8000',
    startTime: 0,
    initiatorType: 'navigation',
    deliveryType: '',
    nextHopProtocol: 'h3',
    workerStart: 0,
    redirectStart: 0,
    redirectEnd: 0,
    fetchStart: 0,
    domainLookupStart: 0,
    domainLookupEnd: 0,
    connectStart: 0,
    connectEnd: 0,
    secureConnectionStart: 0,
    requestStart: 0,
    responseStart: 0,
    responseEnd: 0,
    transferSize: 0,
    encodedBodySize: 0,
    decodedBodySize: 0,
    responseStatus: 0,
    renderBlockingStatus: 'blocking',
    unloadEventStart: 0,
    unloadEventEnd: 0,
    domInteractive: 0,
    domContentLoadedEventStart: 0,
    domContentLoadedEventEnd: 0,
    domComplete: 0,
    loadEventStart: 0,
    loadEventEnd: 0,
    type: 'navigate',
    redirectCount: 0,
    toJSON,
    ...overrides
  }
}

type PerformancePaintTimingName = 'first-paint' | 'first-contentful-paint'

// https://w3c.github.io/paint-timing/#sec-PerformancePaintTiming
export interface PerformancePaintTimingFake extends PerformanceEntryFake {
  // > The duration attribute’s getter must return 0
  duration: 0
  entryType: 'paint'
  name: PerformancePaintTimingName
}

export function createPerformancePaintTimingFake (
  overrides: Partial<PerformancePaintTimingFake> = {}
): PerformancePaintTimingFake {
  return {
    duration: 0,
    entryType: 'paint',
    name: 'first-contentful-paint',
    startTime: 0,
    toJSON,
    ...overrides
  }
}

// https://w3c.github.io/largest-contentful-paint/#sec-largest-contentful-paint-interface
export interface LargestContentfulPaintFake extends PerformanceEntryFake {
  entryType: 'largest-contentful-paint'
  // > The name attribute’s getter must return the empty string
  name: ''
  // > The duration attribute’s getter must return 0.
  duration: 0
  renderTime: number
  loadTime: number
  size: number
  id: string
  url: string
  // note: the spec says 'Element?' but this is not 'Element | undefined', it's
  // 'Element | null' — see the 'get an element' algorithm:
  // https://wicg.github.io/element-timing/#get-an-element
  element: Element | null
}

export function createLargestContentfulPaintFake (
  overrides: Partial<LargestContentfulPaintFake> = {}
): LargestContentfulPaintFake {
  return {
    entryType: 'largest-contentful-paint',
    name: '',
    duration: 0,
    startTime: 0,
    renderTime: 0,
    loadTime: 0,
    size: 0,
    // if 'element' is null then id should be an empty string
    id: '',
    url: 'https://www.bugsnag.com',
    element: null,
    toJSON,
    ...overrides
  }
}

// generic toJSON that will do the Right Thing for these fake objects
// this is necessary to fulfill the interface and provide a useful diff in
// Jest's expectation output
function toJSON (this: PerformanceEntryFake) {
  // this might look equivalent to 'return this' but that makes a recursive
  // object and Jest just displays '[Circular]', which is not very useful
  return Object.assign({}, this)
}
