import { isObject, type Time, type Span, type SpanOptions } from '@bugsnag/core-performance'

export type RouteChangeSpanOptions = Omit<SpanOptions, 'isFirstClass'>
export type StartRouteChangeCallback = (url: URL | string, trigger: string, options?: RouteChangeSpanOptions) => RouteChangeSpan

export interface RouteChangeSpanEndOptions {
  endTime?: number | Date
  url?: URL | string
}

export interface RouteChangeSpan extends Span {
  end: ((endTime?: Time) => void) & ((routeChangeSpanEndOptions: RouteChangeSpanEndOptions) => void)
}

export interface RoutingProvider {
  resolveRoute: (url: URL) => string
  listenForRouteChanges: (startRouteChangeSpan: StartRouteChangeCallback) => void
}

export type RouteResolver = (url: URL) => string

export const isRoutingProvider = (value: unknown): value is RoutingProvider =>
  isObject(value) &&
    typeof value.resolveRoute === 'function' &&
    typeof value.listenForRouteChanges === 'function'
