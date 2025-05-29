import type { RouteChangeSpan, RoutingProvider, StartRouteChangeCallback } from '@bugsnag/browser-performance'
import { onSettle } from '@bugsnag/browser-performance'
import type { AfterNavigate, BeforeNavigate } from '@sveltejs/kit'

type NavigateCallback<T> = (callback: (navigation: T) => void) => void

export class SvelteKitRoutingProvider implements RoutingProvider {
  constructor (private beforeNavigate: NavigateCallback<BeforeNavigate>, private afterNavigate: NavigateCallback<AfterNavigate>, private base = window.location.origin) {}

  // SvelteKit exposes the route as a URL in the beforeNavigate hook
  // so we can use it directly by converting to a string.
  resolveRoute (url: URL) {
    return url.toString()
  }

  listenForRouteChanges (startRouteChangeSpan: StartRouteChangeCallback) {
    let currentSpan: RouteChangeSpan | undefined

    this.beforeNavigate(({ to, type }) => {
      const startTime = performance.now()
      const route = to?.route.id ?? 'unknown'
      const url = new URL(route, this.base)
      currentSpan = startRouteChangeSpan(url, type, { startTime })
    })

    this.afterNavigate(() => {
      onSettle((endTime) => {
        if (currentSpan) {
          currentSpan.end(endTime)
          currentSpan = undefined
        }
      })
    })
  }
}
