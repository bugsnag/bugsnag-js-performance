import { isObject } from '@bugsnag/js-performance-core'

export interface RoutingProvider {
  resolveRoute: RouteResolver
}

type RouteResolver = (url: URL) => string

const defaultRouteResolver: RouteResolver = (url: URL) => url.pathname

export class DefaultRoutingProvider implements RoutingProvider {
  resolveRoute: RouteResolver

  constructor (resolveRoute = defaultRouteResolver) {
    this.resolveRoute = resolveRoute
  }
}

export const isRoutingProvider = (value: unknown): value is RoutingProvider =>
  isObject(value) &&
    typeof value.resolveRoute === 'function'
