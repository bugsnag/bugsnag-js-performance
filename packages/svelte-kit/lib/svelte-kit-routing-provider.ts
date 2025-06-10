import type { RouteChangeSpan, RoutingProvider, StartRouteChangeCallback } from '@bugsnag/browser-performance'
import { defaultRouteResolver, onSettle } from '@bugsnag/browser-performance'
import type { AfterNavigate, BeforeNavigate } from '@sveltejs/kit'

type NavigateCallback<T> = (callback: (navigation: T) => void) => void

export class SvelteKitRoutingProvider implements RoutingProvider {
  private currentRoute: string | undefined
  private currentSpan: RouteChangeSpan | undefined

  constructor (
    private beforeNavigate: NavigateCallback<BeforeNavigate>,
    private afterNavigate: NavigateCallback<AfterNavigate>,
    initialRoute?: string
  ) {
    this.currentRoute = initialRoute
  }

  // resolveRoute is only ever used to get the current route in SvelteKit
  // so we just return the current route and ignore the parameter
  resolveRoute (url: URL) {
    return this.currentRoute || defaultRouteResolver(url)
  }

  listenForRouteChanges (startRouteChangeSpan: StartRouteChangeCallback) {
    this.beforeNavigate(({ to, type }) => {
      const startTime = performance.now()
      const url = to ? to.url : new URL(window.location.href)
      this.currentRoute = to?.route.id ?? this.currentRoute
      this.currentSpan = startRouteChangeSpan(url, type, { startTime })
    })

    this.afterNavigate(() => {
      onSettle((endTime) => {
        if (this.currentSpan) {
          this.currentSpan.end(endTime)
          this.currentSpan = undefined
        }
      })
    })
  }
}
