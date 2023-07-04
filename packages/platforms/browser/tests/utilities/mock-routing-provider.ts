import { type RoutingProvider } from '../../lib'
import { type StartRouteChangeCallback } from '../../lib/routing-provider'

class MockRoutingProvider implements RoutingProvider {
  readonly resolveRoute = () => '/initial-route'

  listenForRouteChanges (startRouteChangeSpan: StartRouteChangeCallback) {
    startRouteChangeSpan(new URL(location.href), 'pushState')
  }
}

export default MockRoutingProvider
