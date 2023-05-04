import DomMutationSettler from './dom-mutation-settler'
import LoadEventEndSettler, { type PerformanceWithTiming } from './load-event-end-settler'
import RequestSettler from './request-settler'
import SettlerAggregate from './settler-aggregate'
import TimeoutSettler from './timeout-settler'
import { type RequestTracker } from '../request-tracker/request-tracker'

const TIMEOUT = 60 * 1000

export default function createOnSettle (
  document: Node,
  fetchRequestTracker: RequestTracker,
  xhrRequestTracker: RequestTracker,
  PerformanceObserverClass: typeof PerformanceObserver,
  performance: PerformanceWithTiming
) {
  const domMutationSettler = new DomMutationSettler(document)
  const fetchRequestSettler = new RequestSettler(fetchRequestTracker)
  const xhrRequestSettler = new RequestSettler(xhrRequestTracker)
  const loadEventEndSettler = new LoadEventEndSettler(PerformanceObserverClass, performance)

  const settler = new SettlerAggregate([
    domMutationSettler,
    loadEventEndSettler,
    fetchRequestSettler,
    xhrRequestSettler
  ])

  return function onSettle (callback: () => void): void {
    const timeout = new TimeoutSettler(TIMEOUT)

    const onSettle = () => {
      // cancel the timeout and unsubscribe - this is fine to do even if the
      // timeout is what called this function
      timeout.cancel()
      timeout.unsubscribe(onSettle)

      // unsubscribe from the settler so we don't call the callback more than
      // once
      settler.unsubscribe(onSettle)

      callback()
    }

    settler.subscribe(onSettle)
    timeout.subscribe(onSettle)
  }
}
