import DomMutationSettler from './dom-mutation-settler'
import LoadEventEndSettler, { type PerformanceWithTiming } from './load-event-end-settler'
import RequestSettler from './request-settler'
import SettlerAggregate from './settler-aggregate'
import { type RequestTracker } from '../request-tracker/request-tracker'
import { type Clock } from '@bugsnag/js-performance-core'

export type OnSettleCallback = () => void

const TIMEOUT_MILLISECONDS = 60 * 1000

export default function createOnSettle (
  clock: Clock,
  document: Node,
  fetchRequestTracker: RequestTracker,
  xhrRequestTracker: RequestTracker,
  PerformanceObserverClass: typeof PerformanceObserver,
  performance: PerformanceWithTiming
) {
  const domMutationSettler = new DomMutationSettler(clock, document)
  const fetchRequestSettler = new RequestSettler(clock, fetchRequestTracker)
  const xhrRequestSettler = new RequestSettler(clock, xhrRequestTracker)
  const loadEventEndSettler = new LoadEventEndSettler(clock, PerformanceObserverClass, performance)

  const settler = new SettlerAggregate(clock, [
    domMutationSettler,
    loadEventEndSettler,
    fetchRequestSettler,
    xhrRequestSettler
  ])

  return function onSettle (callback: OnSettleCallback): void {
    const onSettle = () => {
      clearTimeout(timeout)

      // unsubscribe from the settler so we don't call the callback more than
      // once
      settler.unsubscribe(onSettle)

      callback()
    }

    const timeout = setTimeout(onSettle, TIMEOUT_MILLISECONDS)
    settler.subscribe(onSettle)
  }
}
