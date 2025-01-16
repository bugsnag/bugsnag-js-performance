import type { Plugin, SetAppState, SpanFactory, SpanInternal } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import type { NavigationDelegate } from 'react-native-navigation/lib/dist/src/NavigationDelegate'

import { createNavigationSpan } from '@bugsnag/react-native-performance'

type Reason = 'immediate' | 'mount' | 'unmount' | 'condition'

const NAVIGATION_START_TIMEOUT = 1000
const NAVIGATION_COMPLETE_TIMEOUT = 100

class BugsnagPluginReactNativeNavigationPerformance implements Plugin<ReactNativeConfiguration> {
  private Navigation: NavigationDelegate
  private currentNavigationSpan?: SpanInternal
  private startTime?: number
  private startTimeout?: NodeJS.Timeout
  private endTimeout?: NodeJS.Timeout
  private componentsWaiting = 0
  private spanFactory?: SpanFactory<ReactNativeConfiguration>
  private previousRoute?: string
  private setAppState?: SetAppState

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
      if (this.setAppState) {
        this.setAppState('ready')
      }
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

  configure (_configuration: ReactNativeConfiguration, spanFactory: SpanFactory<ReactNativeConfiguration>, setAppState: SetAppState) {
    this.spanFactory = spanFactory
    this.setAppState = setAppState

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
        if (this.setAppState) {
          this.setAppState('navigating')
        }

        clearTimeout(this.startTimeout)
        const routeName = event.componentName
        this.currentNavigationSpan = createNavigationSpan(spanFactory, routeName, { startTime: this.startTime })
        this.currentNavigationSpan.setAttribute('bugsnag.navigation.triggered_by', '@bugsnag/plugin-react-native-navigation-performance')

        if (this.previousRoute) {
          this.currentNavigationSpan.setAttribute('bugsnag.navigation.previous_route', this.previousRoute)
        }

        this.previousRoute = routeName

        this.triggerNavigationEnd(performance.now(), 'immediate')
      }
    })
  }
}

export default BugsnagPluginReactNativeNavigationPerformance
