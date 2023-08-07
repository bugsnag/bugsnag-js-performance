import { type OnSettle } from '../on-settle'
import { createDefaultRoutingProvider } from './default-routing-provider'
import { stringToRegexp } from './string-to-regexp'

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

export const createReactRouterRoutingProvider = (onSettle: OnSettle, location: Location) => {
  const DefaultRoutingProvider = createDefaultRoutingProvider(onSettle, location)

  return class ReactRouterRoutingProvider extends DefaultRoutingProvider {
    constructor (routes: RouteObject[], basename?: string) {
      function resolveRoute (url: URL): string {
        return flattenRoutes(routes).find((fullRoutePath) => url.pathname.replace(basename ?? '', '').match(stringToRegexp(fullRoutePath))) || '/'
      }
      super(resolveRoute)
    }
  }
}
