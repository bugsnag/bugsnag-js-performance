import { DISCARD_END_TIME } from '@bugsnag/core-performance'
import type { SetAppState, SpanInternal } from '@bugsnag/core-performance'
import type { ReactNativeSpanFactory } from '@bugsnag/react-native-performance'
import type { NavigationAction, NavigationContainerRef, NavigationContainerRefWithCurrent } from '@react-navigation/native'

type Reason = 'condition' | 'mount' | 'unmount' | 'immediate'

interface UnsafeActionEvent {
  data: {
    action: NavigationAction
    noop: boolean
  }
}

const NAVIGATION_START_TIMEOUT = 1000
const NAVIGATION_COMPLETE_TIMEOUT = 100

export class NavigationTracker {
  private currentNavigationSpan?: SpanInternal
  private startTime?: number
  private startTimeout?: NodeJS.Timeout
  private endTimeout?: NodeJS.Timeout
  private componentsWaiting = 0
  private previousRoute?: string

  constructor (
    private readonly spanFactory: ReactNativeSpanFactory,
    private readonly setAppState: SetAppState
  ) {}

  private clearActiveSpan () {
    clearTimeout(this.startTimeout)
    clearTimeout(this.endTimeout)
    this.startTime = undefined
    if (this.currentNavigationSpan?.isValid()) {
      this.spanFactory.endSpan(this.currentNavigationSpan, DISCARD_END_TIME)
    }
    this.currentNavigationSpan = undefined
  }

  private endActiveSpan (endTime: number, endedBy: Reason) {
    if (this.componentsWaiting === 0 && this.currentNavigationSpan) {
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

    if (this.componentsWaiting === 0) {
      this.triggerNavigationEnd(renderTime, endedBy)
    }
  }

  configure (navigationContainerRef: NavigationContainerRef<ReactNavigation.RootParamList> | NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>) {
    const navigationContainer = (navigationContainerRef as NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>).current || navigationContainerRef

    // set the initial route if it exists
    this.previousRoute = navigationContainer.getCurrentRoute()?.name

    // Potential for a navigation to occur
    navigationContainer.addListener('__unsafe_action__', (event: UnsafeActionEvent) => {
      this.clearActiveSpan()
      if (event.data.noop) {
        return
      }

      this.startTime = performance.now()
      this.startTimeout = setTimeout(() => {
        this.clearActiveSpan()
      }, NAVIGATION_START_TIMEOUT)
    })

    // Navigation has occurred
    navigationContainer.addListener('state', () => {
      clearTimeout(this.startTimeout)

      if (typeof this.startTime !== 'number') {
        return
      }

      const currentRoute = navigationContainer.getCurrentRoute()
      if (currentRoute && currentRoute.name !== this.previousRoute) {
        clearTimeout(this.startTimeout)
        this.setAppState('navigating')

        const navigationSpan = this.spanFactory.startNavigationSpan(currentRoute.name, {
          startTime: this.startTime,
          doNotDelegateToNativeSDK: true
        })

        navigationSpan.setAttribute('bugsnag.navigation.triggered_by', '@bugsnag/plugin-react-navigation-performance')

        if (this.previousRoute) {
          navigationSpan.setAttribute('bugsnag.navigation.previous_route', this.previousRoute)
        }

        this.currentNavigationSpan = navigationSpan
        this.previousRoute = currentRoute.name
        this.triggerNavigationEnd(performance.now(), 'immediate')
      }
    })
  }
}
