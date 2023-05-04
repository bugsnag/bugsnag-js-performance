import DomMutationSettler from './dom-mutation-settler'
import LoadEventEndSettler, { type PerformanceWithTiming } from './load-event-end-settler'
import RequestSettler from './request-settler'
import SettlerAggregate from './settler-aggregate'
import { type RequestTracker } from '../request-tracker/request-tracker'

const TIMEOUT_MILLISECONDS = 60 * 1000

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
