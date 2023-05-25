import DomMutationSettler from './dom-mutation-settler'
import LoadEventEndSettler, { type PerformanceWithTiming } from './load-event-end-settler'
import RequestSettler from './request-settler'
import SettlerAggregate from './settler-aggregate'
import { type BrowserConfiguration } from '../config'
import { type RequestTracker } from '../request-tracker/request-tracker'
import { type Clock, type InternalConfiguration, type Plugin } from '@bugsnag/js-performance-core'

export type OnSettle = (callback: OnSettleCallback) => void
export type OnSettleCallback = (settledTime: number) => void
export type OnSettlePlugin = Plugin<BrowserConfiguration> & OnSettle

const TIMEOUT_MILLISECONDS = 60 * 1000

export default function createOnSettle (
  clock: Clock,
  window: Window,
  fetchRequestTracker: RequestTracker,
  xhrRequestTracker: RequestTracker,
  performance: PerformanceWithTiming
): OnSettlePlugin {
  const domMutationSettler = new DomMutationSettler(clock, window.document)
  const fetchRequestSettler = new RequestSettler(clock, fetchRequestTracker)
  const xhrRequestSettler = new RequestSettler(clock, xhrRequestTracker)
  const loadEventEndSettler = new LoadEventEndSettler(
    clock,
    window.addEventListener,
    performance,
    window.document
  )

  const settler = new SettlerAggregate(clock, [
    domMutationSettler,
    loadEventEndSettler,
    fetchRequestSettler,
    xhrRequestSettler
  ])

  function onSettle (callback: OnSettleCallback): void {
    const onSettle: OnSettleCallback = (settledTime: number) => {
      clearTimeout(timeout)

      // unsubscribe from the settler so we don't call the callback more than
      // once
      settler.unsubscribe(onSettle)

      callback(settledTime)
    }

    const timeout = setTimeout(() => {
      const settledTime = clock.now()

      settler.unsubscribe(onSettle)

      callback(settledTime)
    }, TIMEOUT_MILLISECONDS)

    settler.subscribe(onSettle)
  }

  onSettle.configure = function (configuration: InternalConfiguration<BrowserConfiguration>): void {
    const settleIgnoreUrls = configuration.settleIgnoreUrls.map(
      (url: string | RegExp): RegExp => typeof url === 'string' ? RegExp(url) : url
    )

    fetchRequestSettler.setUrlsToIgnore(settleIgnoreUrls)
    xhrRequestSettler.setUrlsToIgnore(settleIgnoreUrls)
  }

  return onSettle
}
