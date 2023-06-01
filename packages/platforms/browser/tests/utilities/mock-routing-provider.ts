import { type RoutingProvider } from '../../lib'
import { type OnSettleCallback } from '../../lib/on-settle'
import { type OnRouteChangeCallback } from '../../lib/routing-provider'

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
    const time = 123
    callback(time)
  }
}

export default MockRoutingProvider
