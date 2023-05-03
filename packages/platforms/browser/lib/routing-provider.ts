import { type Span } from '@bugsnag/js-performance-core'

export const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

interface InitializationParameters {
  pageLoadSpan: Span
}

export interface RoutingProvider {
  initialize: ({ pageLoadSpan }: InitializationParameters) => void
  resolveRoute: RouteResolver
}

type RouteResolver = (url: string) => string

const defaultRouteResolver: RouteResolver = (url: string) => url

export class DefaultRoutingProvider implements RoutingProvider {
  resolveRoute: RouteResolver

  constructor (resolveRoute = defaultRouteResolver) {
    this.resolveRoute = resolveRoute
  }

  initialize ({ pageLoadSpan }: InitializationParameters) {
    const endTime = performance.now() // TODO: Get the correct end time
    pageLoadSpan.end(endTime)
  }
}

export const isRoutingProvider = (value: unknown): value is RoutingProvider =>
  isObject(value) &&
    typeof value.initialize === 'function' &&
    typeof value.resolveRoute === 'function'
