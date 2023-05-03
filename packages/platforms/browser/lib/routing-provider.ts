import { type PageLoadSpan } from './page-load-span-plugin'
import { isObject } from '@bugsnag/js-performance-core/lib/validation'

interface InitializationParameters {
  pageLoadSpan: PageLoadSpan
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
