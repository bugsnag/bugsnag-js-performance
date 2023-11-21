import { APP_INITIALIZER } from '@angular/core'
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router'
import {
  onSettle,
  type RouteChangeSpan,
  type RoutingProvider,
  type StartRouteChangeCallback
} from '@bugsnag/browser-performance'

let globalRouterRef: Router | undefined

export const bugsnagBootstrapper = {
  provide: APP_INITIALIZER,
  useFactory: (router: Router) => {
    globalRouterRef = router

    return () => {}
  },
  multi: true,
  deps: [Router]
}

export class AngularRoutingProvider implements RoutingProvider {
  resolveRoute (url: URL): string {
    if (globalRouterRef) {
      let route = globalRouterRef.routerState.snapshot.root
      let path = ''

      while (route.firstChild) {
        route = route.firstChild

        if (route.routeConfig?.matcher) {
          path += '/<custom URL matcher>'
        } else {
          path += '/' + route.routeConfig?.path
        }
      }

      if (path) {
        return path
      }
    }

    const base = document.baseURI.replace(window.origin, '')
    return url.pathname.replace(base, '') || '/'
  }

  listenForRouteChanges (startRouteChangeSpan: StartRouteChangeCallback): void {
    // wait for the router to be available
    if (!globalRouterRef) {
      setTimeout(() => { this.listenForRouteChanges(startRouteChangeSpan) }, 50)
      return
    }

    let navigation: { url: URL, span: RouteChangeSpan } | undefined

    globalRouterRef.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        const url = new URL(event.url, window.location.origin)

        navigation = {
          url,
          span: startRouteChangeSpan(
            url,
            event.navigationTrigger || 'routeChange'
          )
        }
      } else if (
        navigation && (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        )
      ) {
        onSettle((endTime) => {
          navigation?.span.end({ endTime, url: navigation.url })
          navigation = undefined
        })
      }
    })
  }
}
