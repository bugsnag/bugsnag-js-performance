
import { DefaultRoutingProvider } from '@bugsnag/browser-performance'
import pathToRegexp from 'path-to-regexp'

export interface RouteObject {
  path?: string
  children?: RouteObject[]
}

export interface VueRouter {
  getRoutes: () => RouteObject[]
}

function flattenRoutes (routes: RouteObject[], _prefix: string = ''): string[] {
  const prefix = `${!_prefix || _prefix === '/' ? _prefix : `${_prefix}/`}`
  return [
    ...routes.map(route => `${prefix}${route.path || ''}`),
    ...routes.reduce<string[]>(
      (accum, route) => [...accum, ...(route.children ? flattenRoutes(route.children, `${prefix}${route.path}`) : [])],
      []
    )
  ]
}

export class VueRouterRoutingProvider extends DefaultRoutingProvider {
  constructor (router: VueRouter, basename?: string) {
    function resolveRoute (url: URL): string {
      return flattenRoutes(router.getRoutes()).find((fullRoutePath) => url.pathname.replace(basename ?? '', '').match(pathToRegexp(fullRoutePath))) || 'no-route-found'
    }
    super(resolveRoute)
  }
}
