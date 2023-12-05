import {
  onSettle,
  type RouteResolver,
  type RoutingProvider,
  type StartRouteChangeCallback
} from '@bugsnag/browser-performance'
import pathToRegexp from 'path-to-regexp'
import { type RouteRecordRaw, type Router } from 'vue-router'

function flattenRoutes (routes: RouteRecordRaw[], _prefix: string = ''): string[] {
  const prefix = `${!_prefix || _prefix === '/' ? _prefix : `${_prefix}/`}`
  return [
    ...routes.map(route => `${prefix}${route.path || ''}`),
    ...routes.reduce<string[]>(
      (accum, route) => [...accum, ...(route.children ? flattenRoutes(route.children, `${prefix}${route.path}`) : [])],
      []
    )
  ]
}

export class VueRouterRoutingProvider implements RoutingProvider {
  router: Router
  resolveRoute: RouteResolver

  constructor (router: Router, basename?: string) {
    this.router = router

    const normalizedBasename = !basename || basename === '/' ? '' : basename

    function resolveRoute (url: URL): string {
      return flattenRoutes(router.getRoutes()).find((fullRoutePath) => url.pathname.replace(normalizedBasename ?? '', '').match(pathToRegexp(fullRoutePath))) || 'no-route-found'
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
