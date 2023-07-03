import { isObject, type Span, type SpanOptions } from '@bugsnag/core-performance'

export type RouteChangeSpanOptions = Omit<SpanOptions, 'isFirstClass'>
export type StartRouteChangeCallback = (url: string, route: string, trigger: string, options?: RouteChangeSpanOptions) => Span

export interface RoutingProvider {
  resolveRoute: (url: URL) => string
  listenForRouteChanges: (startRouteChangeSpan: StartRouteChangeCallback) => void
}

export type RouteResolver = (url: URL) => string

export const isRoutingProvider = (value: unknown): value is RoutingProvider =>
  isObject(value) &&
    typeof value.resolveRoute === 'function' &&
    typeof value.listenForRouteChanges === 'function'
