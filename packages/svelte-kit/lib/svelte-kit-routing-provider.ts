import type { RouteChangeSpan, RoutingProvider, StartRouteChangeCallback } from '@bugsnag/browser-performance'
import { onSettle } from '@bugsnag/browser-performance'
import type { AfterNavigate, BeforeNavigate } from '@sveltejs/kit'

type NavigateCallback<T> = (callback: (navigation: T) => void) => void

export class SvelteKitRoutingProvider implements RoutingProvider {
  private currentRoute = '/'

  constructor (private beforeNavigate: NavigateCallback<BeforeNavigate>, private afterNavigate: NavigateCallback<AfterNavigate>) {}

  // resolveRoute is only ever used to get the current route in SvelteKit
  // so we just return the current route and ignore the parameter
  resolveRoute (urlOrRoute: URL | string) {
    return this.currentRoute
  }

  listenForRouteChanges (startRouteChangeSpan: StartRouteChangeCallback) {
    let currentSpan: RouteChangeSpan | undefined

    this.beforeNavigate(({ to, type }) => {
      const startTime = performance.now()
      this.currentRoute = to?.route.id ?? '/'
      const url = to?.url || '/'
      currentSpan = startRouteChangeSpan(url, type, { startTime })
    })

    this.afterNavigate(({ to }) => {
      this.currentRoute = to?.route.id ?? '/'

      onSettle((endTime) => {
        if (currentSpan) {
          currentSpan.end(endTime)
          currentSpan = undefined
        }
      })
    })
  }
}
