import { type RoutingProvider } from '../../lib'
import { type OnRouteChangeCallback, type OnSettleCallback } from '../../lib/routing-provider'

class MockRoutingProvider implements RoutingProvider {
  readonly initialRoute = '/initial-route'

  resolveRoute (url: URL) {
    return url.pathname
  }

  onRouteChange (callback: OnRouteChangeCallback) {
    const route = '/new-route'
    callback(route)
  }

  onSettle (callback: OnSettleCallback) {
    callback()
  }
}

export default MockRoutingProvider
