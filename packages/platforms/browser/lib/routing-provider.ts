import { isObject } from '@bugsnag/core-performance'
import { type StartRouteChangeSpan } from './auto-instrumentation'

export interface RoutingProvider {
  resolveRoute: RouteResolver
  getInitialRoute: () => string
  configure: (startRouteChangeSpan: StartRouteChangeSpan) => void
}

export type RouteResolver = (url: URL) => string

export const isRoutingProvider = (value: unknown): value is RoutingProvider =>
  isObject(value) &&
    typeof value.resolveRoute === 'function' &&
    typeof value.configure === 'function'
