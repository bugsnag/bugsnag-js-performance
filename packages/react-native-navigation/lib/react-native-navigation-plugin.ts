import type { Plugin, SpanFactory, SpanInternal } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import type { NavigationDelegate } from 'react-native-navigation/lib/dist/src/NavigationDelegate'

type Reason = 'immediate' | 'mount' | 'unmount' | 'condition'

const NAVIGATION_START_TIMEOUT = 1000
const NAVIGATION_COMPLETE_TIMEOUT = 100

class ReactNativeNavigationPlugin implements Plugin<ReactNativeConfiguration> {
  private Navigation: NavigationDelegate
  private currentNavigationSpan?: SpanInternal
  private startTime?: number
  private startTimeout?: NodeJS.Timeout
  private endTimeout?: NodeJS.Timeout
  private componentsWaiting = 0
  private spanFactory?: SpanFactory<ReactNativeConfiguration>
  private previousRoute?: string

  constructor (Navigation: NavigationDelegate) {
    this.Navigation = Navigation
  }

  private clearActiveSpan () {
    clearTimeout(this.startTimeout)
    clearTimeout(this.endTimeout)
    this.startTime = undefined
    this.currentNavigationSpan = undefined
  }

  private endActiveSpan (endTime: number, endedBy: Reason) {
    if (this.componentsWaiting === 0 && this.currentNavigationSpan && this.spanFactory) {
      this.currentNavigationSpan.setAttribute('bugsnag.navigation.ended_by', endedBy)
      this.spanFactory.endSpan(this.currentNavigationSpan, endTime)
      this.clearActiveSpan()
    }
  }

  /** Trigger the end of the current navigation span after 100ms */
  private triggerNavigationEnd = (endTime: number, endedBy: Reason) => {
    clearTimeout(this.endTimeout)
    this.endTimeout = setTimeout(() => {
      this.endActiveSpan(endTime, endedBy)
    }, NAVIGATION_COMPLETE_TIMEOUT)
  }

  /**
   * Blocks the current navigation by incrementing the count of components waiting
   */
  blockNavigationEnd = () => {
    clearTimeout(this.endTimeout)
    this.componentsWaiting += 1
  }

  /**
   * Unblocks the current navigation by decrementing the count of components waiting and setting the reason
  */
  unblockNavigationEnd = (endedBy: Reason) => {
    const renderTime = performance.now()
    this.componentsWaiting = Math.max(this.componentsWaiting - 1, 0)

    if (this.componentsWaiting === 0 && this.spanFactory) {
      this.triggerNavigationEnd(renderTime, endedBy)
    }
  }

  configure (configuration: ReactNativeConfiguration, spanFactory: SpanFactory<ReactNativeConfiguration>) {
    this.spanFactory = spanFactory

    // Potential for a navigation to occur
    this.Navigation.events().registerCommandListener((name, params) => {
      this.clearActiveSpan()
      this.startTime = performance.now()
      this.startTimeout = setTimeout(() => {
        this.clearActiveSpan()
      }, NAVIGATION_START_TIMEOUT)
    })

    // Navigation has occurred
    this.Navigation.events().registerComponentWillAppearListener(event => {
      if (typeof this.startTime === 'number') {
        clearTimeout(this.startTimeout)

        const routeName = event.componentName
        this.currentNavigationSpan = spanFactory.startSpan('[Navigation]' + routeName, {
          startTime: this.startTime,
          isFirstClass: true
        })

        this.currentNavigationSpan.setAttribute('bugsnag.span.category', 'navigation')
        this.currentNavigationSpan.setAttribute('bugsnag.navigation.route', routeName)
        this.currentNavigationSpan.setAttribute('bugsnag.navigation.triggered_by', '@bugsnag/react-native-navigation-performance')

        if (this.previousRoute) {
          this.currentNavigationSpan.setAttribute('bugsnag.navigation.previous_route', this.previousRoute)
        }

        this.previousRoute = routeName

        this.triggerNavigationEnd(performance.now(), 'immediate')
      }
    })
  }
}

export default ReactNativeNavigationPlugin
