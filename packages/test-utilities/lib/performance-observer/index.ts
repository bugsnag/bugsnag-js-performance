import {
  type PerformanceEntryFake,
  type PerformanceEntryType,
  type PerformanceNavigationTimingFake
} from './performance-entry'
import PerformanceObserverEntryListFake from './performance-observer-entry-list'

// options valid when observing a single PerformanceEntryType
interface SingleTypeObserveOptions {
  type: PerformanceEntryType
  buffered?: boolean
}

// options valid when observing multiple PerformanceEntryTypes
interface MultipleTypeObserveOptions {
  entryTypes: PerformanceEntryType[]
}

// observe can either be passed entryTypes OR (type and (optionally) buffered)
// https://w3c.github.io/performance-timeline/#dom-performanceobserverinit
type ObserveOptions = SingleTypeObserveOptions | MultipleTypeObserveOptions

function isSingleTypeObserveOptions (options: ObserveOptions): options is SingleTypeObserveOptions {
  return !!options && typeof options === 'object' && typeof (options as any).type !== 'undefined'
}

// https://w3c.github.io/performance-timeline/#performanceobservercallbackoptions-dictionary
interface PerformanceObserverCallbackOptions {
  droppedEntriesCount: number
}

// https://w3c.github.io/performance-timeline/#dom-performanceobservercallback
type PerformanceObserverCallback = (
  entries: PerformanceObserverEntryListFake,
  observer: PerformanceObserverFake,
  options?: PerformanceObserverCallbackOptions
) => void

interface PerformanceObserverFake extends PerformanceObserver {
  entryTypes: Set<PerformanceEntryType>
  trigger: (entries: PerformanceObserverEntryListFake) => void
}

const ALL_SUPPORTED_ENTRY_TYPES = [
  'mark',
  'measure',
  'navigation',
  'resource',
  'longtask',
  'paint',
  'element',
  'event',
  'first-input',
  'layout-shift',
  'largest-contentful-paint'
]

export class PerformanceObserverManager {
  private readonly observers = new Set<PerformanceObserverFake>()
  private buffer: PerformanceEntryFake[] = []

  queueEntry (entry: PerformanceEntryFake): void {
    this.buffer.push(entry)
  }

  flushQueue (): void {
    for (const observer of this.observers) {
      const entries = new PerformanceObserverEntryListFake(
        this.buffer.filter(entry => observer.entryTypes.has(entry.entryType))
      )

      observer.trigger(entries)
    }

    this.buffer = []
  }

  createPerformanceObserverFakeClass (
    supportedEntryTypes: string[] | undefined | null = ALL_SUPPORTED_ENTRY_TYPES
  ): typeof PerformanceObserver {
    const registerInstance = this.observers.add.bind(this.observers)
    const deregisterInstance = this.observers.delete.bind(this.observers)
    const clearBuffer = () => { this.buffer = [] }

    // use 'null' to signal that supportedEntryTypes should not be implemented
    if (supportedEntryTypes === null) {
      supportedEntryTypes = undefined
    }

    // @ts-expect-error 'supportedEntryTypes' is supposed to be 'string[]' but
    //                  it's possible for it to be unsupported ('undefined') so
    //                  we have to expect an error here
    return class {
      public readonly entryTypes = new Set<PerformanceEntryType>()

      private observing: boolean = false
      private readonly callback: PerformanceObserverCallback

      constructor (callback: PerformanceObserverCallback) {
        this.callback = callback

        registerInstance(this)
      }

      // NON SPEC
      trigger (entries: PerformanceObserverEntryListFake): void {
        this.callback(entries, this)
      }

      // https://w3c.github.io/performance-timeline/#dom-performanceobserver-observe
      observe (options: ObserveOptions): void {
        // for simplicity we don't support multiple calls to 'observer'
        // this is allowed by the spec, but it makes things more complicated and we
        // don't need it for our use of PerformanceObserver
        if (this.observing) {
          throw new Error('PerformanceObserver#observe does not support multiple calls')
        }

        this.observing = true

        if (isSingleTypeObserveOptions(options)) {
          this.entryTypes.add(options.type)

          if (!options.buffered) {
            clearBuffer()
          }
        } else {
          for (const type of options.entryTypes) {
            this.entryTypes.add(type)
          }

          clearBuffer()
        }
      }

      // https://w3c.github.io/performance-timeline/#dom-performanceobserver-supportedentrytypes
      static get supportedEntryTypes (): string[] | undefined {
        return supportedEntryTypes as string[] | undefined
      }

      // https://w3c.github.io/performance-timeline/#disconnect-method
      disconnect (): void {
        deregisterInstance(this)
      }

      // https://w3c.github.io/performance-timeline/#takerecords-method
      takeRecords (): any {
        // we don't need to support takeRecords, so we don't implement it
        throw new Error('PerformanceObserver#takeRecords is not implemented')
      }
    }
  }

  createPerformanceEntryFake (
    overrides: Partial<PerformanceEntryFake> = {}
  ): PerformanceEntryFake {
    return {
      duration: 0,
      entryType: 'navigation',
      name: 'fake-entry',
      startTime: 0,
      toJSON () {},
      ...overrides
    }
  }

  createPerformanceNavigationTimingFake (
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
      toJSON () {},
      ...overrides
    }
  }
}
