import { type RoutingProvider } from '@bugsnag/browser-performance'
import { type StartRouteChangeSpan } from '@bugsnag/browser-performance/dist/types/auto-instrumentation'
import { type OnSettle } from '@bugsnag/browser-performance/dist/types/on-settle'

class DefaultRoutingProvider implements RoutingProvider {
  getInitialRoute () {
    return '/initial-route'
  }

  resolveRoute (url: URL) {
    return url.pathname
  }

  configure (startRouteChangeSpan: StartRouteChangeSpan, onSettle: OnSettle) {

  }
}

export default DefaultRoutingProvider
