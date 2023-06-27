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

interface ServerTiming {
  description: string
  duration: number
  name: string
  toJSON: () => unknown
}

// https://www.w3.org/TR/resource-timing/#dom-performanceresourcetiming
export interface PerformanceResourceTimingFake extends PerformanceEntryFake {
  entryType: 'resource'
  initiatorType: InitiatorType
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
  serverTiming: ServerTiming[]
  transferSize: number
  encodedBodySize: number
  decodedBodySize: number
  responseStatus: number
  renderBlockingStatus: RenderBlockingStatusType
}

export type NavigationTimingType = 'navigate' | 'reload' | 'back_forward' | 'prerender'

// https://w3c.github.io/navigation-timing/#dom-performancenavigationtiming
export interface PerformanceNavigationTimingFake extends Omit<PerformanceResourceTimingFake, 'entryType' | 'serverTiming'>, PerformanceEntryFake {
  deliveryType: DeliveryType
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

export function createPerformanceResourceNavigationTimingFake (overrides: Partial<PerformanceResourceTimingFake>): PerformanceResourceTimingFake {
  return {
    connectEnd: 0,
    connectStart: 0,
    decodedBodySize: 0,
    domainLookupEnd: 0,
    domainLookupStart: 0,
    duration: 0,
    encodedBodySize: 0,
    entryType: 'resource',
    fetchStart: 0,
    initiatorType: 'img',
    name: 'http://localhost:8000/image.jpg',
    nextHopProtocol: 'h2',
    redirectEnd: 0,
    redirectStart: 0,
    renderBlockingStatus: 'non-blocking',
    requestStart: 0,
    responseEnd: 0,
    responseStart: 0,
    responseStatus: 0,
    secureConnectionStart: 0,
    serverTiming: [],
    startTime: 0,
    transferSize: 0,
    workerStart: 0,
    toJSON,
    ...overrides
  }
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

// https://w3c.github.io/event-timing/#sec-performance-event-timing
interface PerformanceEventTimingFake extends PerformanceEntryFake {
  entryType: 'event' | 'first-input'
  processingStart: number
  processingEnd: number
  cancelable: boolean
  target: Node | null
  interactionId: number
}

export function createPerformanceEventTimingFake (
  overrides: Partial<PerformanceEventTimingFake> = {}
): PerformanceEventTimingFake {
  return {
    entryType: 'first-input',
    name: 'click',
    startTime: 0,
    duration: 0,
    processingStart: 0,
    processingEnd: 0,
    cancelable: true,
    target: null,
    interactionId: 0,
    toJSON,
    ...overrides
  }
}

// https://wicg.github.io/layout-instability/#sec-layout-shift
interface LayoutShiftFake extends PerformanceEntryFake {
  entryType: 'layout-shift'
  value: number
  hadRecentInput: boolean
  lastInputTime: number
  sources: LayoutShiftAttribution[]
}

// https://wicg.github.io/layout-instability/#sec-layout-shift-attribution
interface LayoutShiftAttribution {
  node: Node | null
  previouslRect: DOMRectReadOnly
  currentRect: DOMRectReadOnly
}

export function createLayoutShiftFake (
  overrides: Partial<LayoutShiftFake> = {}
): LayoutShiftFake {
  return {
    entryType: 'layout-shift',
    // this is not a mistake — the name and entryType are both 'layout-shift':
    // https://wicg.github.io/layout-instability/#sec-report-layout-shift
    name: 'layout-shift',
    startTime: 0,
    duration: 0,
    value: 0,
    lastInputTime: 0,
    hadRecentInput: false,
    sources: [],
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
