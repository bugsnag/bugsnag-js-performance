export const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export interface RoutingProvider {
  resolveRoute: RouteResolver
}

type RouteResolver = (url: string) => string

const defaultRouteResolver: RouteResolver = (url: string) => url

export class DefaultRoutingProvider implements RoutingProvider {
  resolveRoute: RouteResolver

  constructor (resolveRoute = defaultRouteResolver) {
    this.resolveRoute = resolveRoute
  }
}

export const isRoutingProvider = (value: unknown): value is RoutingProvider =>
  isObject(value) &&
    typeof value.resolveRoute === 'function'
