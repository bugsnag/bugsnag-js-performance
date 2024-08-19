import { onSettle } from '@bugsnag/browser-performance'
import type { RouteResolver, RoutingProvider, StartRouteChangeCallback } from '@bugsnag/browser-performance'
import type { Router } from 'vue-router'

export class VueRouterRoutingProvider implements RoutingProvider {
  router: Router
  resolveRoute: RouteResolver

  constructor (router: Router, basename?: string) {
    this.router = router

    const normalizedBasename = !basename || basename === '/' ? '' : basename

    function resolveRoute (url: URL): string {
      const location = router.resolve({ path: url.pathname.replace(normalizedBasename ?? '', '') })
      return location.matched.pop()?.path || 'no-route-found'
    }
    this.resolveRoute = resolveRoute
  }

  listenForRouteChanges (startRouteChangeSpan: StartRouteChangeCallback) {
    this.router.beforeResolve((to, from) => {
      if (!from.name) {
        // initial load
        return
      }
      const absoluteURL = new URL(to.path, document.baseURI)
      const span = startRouteChangeSpan(absoluteURL, 'beforeResolve')
      onSettle((endTime) => {
        span.end(endTime)
      })
    })
  }
}
