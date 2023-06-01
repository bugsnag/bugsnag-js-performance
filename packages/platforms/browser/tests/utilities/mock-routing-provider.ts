import { type RoutingProvider } from '../../lib'

class MockRoutingProvider implements RoutingProvider {
  getInitialRoute () {
    return '/initial-route'
  }

  resolveRoute (url: URL) {
    return url.pathname
  }

  configure () {

  }
}

export default MockRoutingProvider
