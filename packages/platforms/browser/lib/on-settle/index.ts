import DomMutationSettler from './dom-mutation-settler'
import LoadEventEndSettler from './load-event-end-settler'
import type { PerformanceWithTiming } from './load-event-end-settler'
import RequestSettler from './request-settler'
import SettlerAggregate from './settler-aggregate'
import type { BrowserConfiguration } from '../config'
import type { RequestTracker } from '@bugsnag/request-tracker-performance'
import type { Clock, InternalConfiguration, Plugin } from '@bugsnag/core-performance'

export type OnSettle = (callback: OnSettleCallback) => void
export type OnSettleCallback = (settledTime: number) => void
export type OnSettlePlugin = Plugin<BrowserConfiguration> & OnSettle

const TIMEOUT_MILLISECONDS = 60 * 1000

export function createNoopOnSettle (): OnSettlePlugin {
  const noop = () => {}
  noop.configure = () => {}
  return noop as OnSettlePlugin
}

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

  function onSettlePlugin (callback: OnSettleCallback): void {
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

    // if we're already settled apply a 100ms "cooldown" period in case we
    // unsettle immediately after this call
    // if we're not settled then this cooldown is irrelevant - we can just
    // subscribe to the settler to be notified of when the page settles
    const cooldown = settler.isSettled() ? 100 : 0
    const settledTime = clock.now()

    setTimeout(() => {
      if (settler.isSettled()) {
        // if we're still settled call the callback via "onSettle"
        onSettle(settledTime)
      } else {
        // otherwise wait for the page to settle
        settler.subscribe(onSettle)
      }
    }, cooldown)
  }

  onSettlePlugin.configure = function (configuration: InternalConfiguration<BrowserConfiguration>): void {
    const settleIgnoreUrls = configuration.settleIgnoreUrls.map(
      (url: string | RegExp): RegExp => typeof url === 'string' ? RegExp(url) : url
    ).concat(RegExp(configuration.endpoint))

    fetchRequestSettler.setUrlsToIgnore(settleIgnoreUrls)
    xhrRequestSettler.setUrlsToIgnore(settleIgnoreUrls)
  }

  return onSettlePlugin
}
