import LoadEventEndSettler from './on-settle/dom-mutation-settler'
import { type PageLoadSpan } from './page-load-span-plugin'

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
  settler: LoadEventEndSettler
  resolveRoute: RouteResolver

  constructor (resolveRoute = defaultRouteResolver) {
    this.settler = new LoadEventEndSettler(document)
    this.resolveRoute = resolveRoute
  }

  initialize ({ pageLoadSpan }: InitializationParameters) {
    this.settler.subscribe(() => {
      const endTime = performance.now() // TODO: Get the correct end time
      pageLoadSpan.end(endTime)
    })
  }
}

export const isRoutingProvider = (value: unknown): value is RoutingProvider => {
  return true
}
