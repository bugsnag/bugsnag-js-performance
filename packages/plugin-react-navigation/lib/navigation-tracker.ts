import type { SetAppState, SpanInternal } from '@bugsnag/core-performance'
import type { ReactNativeSpanFactory } from '@bugsnag/react-native-performance'

export class NavigationTracker {
  private currentSpan?: SpanInternal
  private previousRoute?: string
  private readonly DISCARDED = -1

  constructor (
    private readonly spanFactory: ReactNativeSpanFactory,
    private readonly setAppState: SetAppState
  ) {}

  handleRouteChange (newRoute: string) {
    const updateTime = performance.now()

    if (this.currentSpan) {
      this.spanFactory.endSpan(this.currentSpan, this.DISCARDED)
    }

    const span = this.spanFactory.startNavigationSpan(newRoute, {
      startTime: updateTime,
      doNotDelegateToNativeSDK: true
    })

    this.setAppState('navigating')
    span.setAttribute('bugsnag.navigation.triggered_by', '@bugsnag/plugin-react-navigation-performance')

    if (this.previousRoute) {
      span.setAttribute('bugsnag.navigation.previous_route', this.previousRoute)
    }

    this.currentSpan = span
    this.previousRoute = newRoute

    return span
  }

  completeNavigation (endTime: number, endCondition: string = 'immediate') {
    if (!this.currentSpan) {
      return false
    }

    this.currentSpan.setAttribute('bugsnag.navigation.ended_by', endCondition)
    this.spanFactory.endSpan(this.currentSpan, endTime)
    this.setAppState('ready')
    this.currentSpan = undefined
    return true
  }
}
