import { type RoutingProvider } from '@bugsnag/browser-performance'

class DefaultRoutingProvider implements RoutingProvider {
  getInitialRoute () {
    return '/initial-route'
  }

  resolveRoute (url: URL) {
    return url.pathname
  }

  configure () {

  }
}

export default DefaultRoutingProvider
