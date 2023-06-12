import { type RoutingProvider } from '../../lib'
import { type StartRouteChangeCallback } from '../../lib/routing-provider'

class MockRoutingProvider implements RoutingProvider {
  readonly resolveRoute = () => '/initial-route'

  listenForRouteChanges (startRouteChangeSpan: StartRouteChangeCallback) {
    const route = '/new-route'
    startRouteChangeSpan(route)
  }
}

export default MockRoutingProvider
