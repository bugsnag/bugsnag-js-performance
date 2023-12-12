import { DefaultRoutingProvider } from '@bugsnag/browser-performance'
import { matchPath } from 'react-router-dom'

export interface RouteObject {
  path?: string
  children?: RouteObject[]
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

export class ReactRouterRoutingProvider extends DefaultRoutingProvider {
  constructor (routes: RouteObject[], basename?: string) {
    const normalizedBasename = !basename || basename === '/' ? '' : basename

    function resolveRoute (url: URL): string {
      return flattenRoutes(routes).find((fullRoutePath) => matchPath(fullRoutePath, url.pathname.replace(normalizedBasename ?? '', ''))?.pattern.path) || 'no-route-found'
    }
    super(resolveRoute)
  }
}
