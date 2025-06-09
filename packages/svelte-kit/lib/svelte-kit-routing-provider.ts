import type { RouteChangeSpan, RoutingProvider, StartRouteChangeCallback } from '@bugsnag/browser-performance'
import { onSettle, defaultRouteResolver } from '@bugsnag/browser-performance'
import type { AfterNavigate, BeforeNavigate } from '@sveltejs/kit'

type NavigateCallback<T> = (callback: (navigation: T) => void) => void

export class SvelteKitRoutingProvider implements RoutingProvider {
  private currentRoute: string | undefined

  constructor (private beforeNavigate: NavigateCallback<BeforeNavigate>, private afterNavigate: NavigateCallback<AfterNavigate>) {}

  // resolveRoute is only ever used to get the current route in SvelteKit
  // so we just return the current route and ignore the parameter
  resolveRoute (url: URL) {
    return this.currentRoute || defaultRouteResolver(url)
  }

  listenForRouteChanges (startRouteChangeSpan: StartRouteChangeCallback) {
    let currentSpan: RouteChangeSpan | undefined

    this.beforeNavigate(({ to, type }) => {
      const startTime = performance.now()
      if (to && to.route.id) {
        this.currentRoute = to.route.id
      }
      const url = to ? to.url : new URL(window.location.href)
      currentSpan = startRouteChangeSpan(url, type, { startTime })
    })

    this.afterNavigate(({ to }) => {
      if (to && to.route.id) {
        this.currentRoute = to.route.id
      }

      onSettle((endTime) => {
        if (currentSpan) {
          currentSpan.end(endTime)
          currentSpan = undefined
        }
      })
    })
  }
}
