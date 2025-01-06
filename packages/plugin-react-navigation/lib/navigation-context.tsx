import type { SpanInternal } from '@bugsnag/core-performance'
import type { ReactNativeSpanFactory } from '@bugsnag/react-native-performance'
import type { PropsWithChildren } from 'react'

import React from 'react'

export const NavigationContext = React.createContext({
  blockNavigationEnd: () => {},
  unblockNavigationEnd: (condition: EndCondition) => {},
  triggerNavigationEnd: () => {}
})

interface Props extends PropsWithChildren {
  currentRoute?: string
  spanFactory: ReactNativeSpanFactory
}

type EndCondition = 'condition' | 'mount' | 'unmount' | 'immediate'

const DISCARDED = -1

export class NavigationContextProvider extends React.Component<Props> {
  private currentSpan?: SpanInternal
  private timerRef?: NodeJS.Timeout
  private endCondition: EndCondition = 'immediate'
  private previousRoute?: string
  private lastRenderTime = 0
  private componentsLoading = 0

  blockNavigationEnd = () => {
    this.lastRenderTime = 0
    this.componentsLoading = this.componentsLoading + 1
  }

  unblockNavigationEnd = (endCondition: EndCondition) => {
    this.lastRenderTime = performance.now()
    this.componentsLoading = Math.max(this.componentsLoading - 1, 0)

    if (this.componentsLoading === 0) {
      this.endCondition = endCondition
      this.triggerNavigationEnd()
    }
  }

  triggerNavigationEnd = () => {
    clearTimeout(this.timerRef)

    // Spans ended without a specific end condition will need to use the time `triggerNavigationEnd` was called
    const triggerNavigationEndTime = performance.now()

    this.timerRef = setTimeout(() => {
      if (this.componentsLoading === 0 && this.currentSpan) {
        this.currentSpan.setAttribute('bugsnag.navigation.ended_by', this.endCondition)
        const endTime = Math.max(this.lastRenderTime, triggerNavigationEndTime)
        this.props.spanFactory.endSpan(this.currentSpan, endTime)

        this.currentSpan = undefined
        this.lastRenderTime = 0
      }
    }, 100)
  }

  componentDidUpdate (prevProps: Props) {
    const updateTime = performance.now()

    const { currentRoute, spanFactory } = this.props

    if (currentRoute && currentRoute !== prevProps.currentRoute) {
      // If there is already an active navigation span, end it with an
      // invalid time to cause it to be discarded from the context stack.
      if (this.currentSpan) {
        spanFactory.endSpan(this.currentSpan, DISCARDED)
      }

      const span = spanFactory.startNavigationSpan(currentRoute, { startTime: updateTime })
      span.setAttribute('bugsnag.navigation.triggered_by', '@bugsnag/plugin-react-navigation-performance')

      if (this.previousRoute) {
        span.setAttribute('bugsnag.navigation.previous_route', this.previousRoute)
      }

      this.currentSpan = span
      this.endCondition = 'immediate'
      this.previousRoute = currentRoute

      setTimeout(() => {
        this.triggerNavigationEnd()
      })
    }
  }

  componentWillUnmount () {
    clearTimeout(this.timerRef)
  }

  render () {
    const { ...rest } = this.props

    return (
      <NavigationContext.Provider
        {...rest}
        value={{
          blockNavigationEnd: this.blockNavigationEnd,
          unblockNavigationEnd: this.unblockNavigationEnd,
          triggerNavigationEnd: this.triggerNavigationEnd
        }}
      />
    )
  }
}
