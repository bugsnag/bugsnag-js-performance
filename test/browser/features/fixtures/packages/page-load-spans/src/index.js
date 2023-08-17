import BugsnagPerformance, { onSettle } from '@bugsnag/browser-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

class CustomRoutingProvider {
    resolveRoute = (url) => url.pathname || '/'

    listenForRouteChanges (startRouteChangeSpan) {
      addEventListener('popstate', (ev) => {
        const url = new URL(window.location.href)
        const span = startRouteChangeSpan(url, 'popstate')

        onSettle((endTime) => {
          span.end(endTime)
        })
      })

      const originalPushState = history.pushState
      history.pushState = function (...args) {
        const url = args[2]

        if (url) {
          const absoluteURL = new URL(url.toString(), document.baseURI)
          const span = startRouteChangeSpan(absoluteURL, 'pushState')

          onSettle((endTime) => {
            span.end(endTime)
          })
        }

        originalPushState.apply(this, args)
      }
    }
  }

BugsnagPerformance.start({ apiKey, endpoint, maximumBatchSize: 13, batchInactivityTimeoutMs: 5000, autoInstrumentNetworkRequests: false, routingProvider: new CustomRoutingProvider() })
