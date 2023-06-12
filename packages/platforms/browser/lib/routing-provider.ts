import { isObject, type Span, type Time } from '@bugsnag/core-performance'

export type StartRouteChangeCallback = (newRoute: string, routeChangeTime?: Time) => Span

export interface RoutingProvider {
  resolveRoute: (url: URL) => string
  listenForRouteChanges: (startRouteChangeSpan: StartRouteChangeCallback) => void
}

export type RouteResolver = (url: URL) => string

export const isRoutingProvider = (value: unknown): value is RoutingProvider =>
  isObject(value) &&
    typeof value.resolveRoute === 'function' &&
    typeof value.listenForRouteChanges === 'function'
