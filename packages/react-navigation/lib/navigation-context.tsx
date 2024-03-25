import type { SpanFactory, SpanInternal } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import React, { type PropsWithChildren } from 'react'

export const NavigationContext = React.createContext({
  blockNavigationEnd: () => {},
  unblockNavigationEnd: (condition: EndCondition) => {},
  triggerNavigationEnd: () => {}
})

interface Props extends PropsWithChildren {
  currentRoute?: string
  spanFactory: SpanFactory<ReactNativeConfiguration>
}

interface State {
  componentsLoading: number
  previousRoute?: string
  lastRenderTime: number
}

type EndCondition = 'condition' | 'mount' | 'unmount' | 'immediate'

const DISCARDED = -1

export class NavigationContextProvider extends React.Component<Props, State> {
  private currentSpan?: SpanInternal
  private timerRef?: NodeJS.Timeout
  private endCondition: EndCondition = 'immediate'

  state = {
    previousRoute: undefined,
    componentsLoading: 0,
    lastRenderTime: 0
  }

  blockNavigationEnd = () => {
    this.setState(prevState => ({
      ...prevState,
      componentsLoading: prevState.componentsLoading + 1,
      lastRenderTime: 0
    }))
  }

  unblockNavigationEnd = (condition: EndCondition) => {
    this.setState(prevState => ({
      ...prevState,
      componentsLoading: Math.max(prevState.componentsLoading - 1, 0),
      lastRenderTime: performance.now()
    }), () => {
      if (this.state.componentsLoading === 0) {
        this.endCondition = condition
        this.triggerNavigationEnd()
      }
    })
  }

  triggerNavigationEnd = () => {
    clearTimeout(this.timerRef)

    // Spans ended without a specific end condition will need to use the time `triggerNavigationEnd` was called
    const triggerNavigationEndTime = performance.now()

    this.timerRef = setTimeout(() => {
      if (this.state.componentsLoading === 0 && this.currentSpan) {
        this.currentSpan.setAttribute('bugsnag.navigation.ended_by', this.endCondition)
        const endTime = this.state.lastRenderTime === 0 ? triggerNavigationEndTime : this.state.lastRenderTime
        this.props.spanFactory.endSpan(this.currentSpan, endTime)
        this.currentSpan = undefined
      }
    }, 100)
  }

  componentDidUpdate (prevProps: Props) {
    const { currentRoute, spanFactory } = this.props

    if (currentRoute && currentRoute !== prevProps.currentRoute) {
      // If there is already an active navigation span, end it with an
      // invalid time to cause it to be discarded from the context stack.
      if (this.currentSpan) {
        spanFactory.endSpan(this.currentSpan, DISCARDED)
      }

      const span = spanFactory.startSpan(`[Navigation]${currentRoute}`, {
        isFirstClass: true
      })

      span.setAttribute('bugsnag.span.category', 'navigation')
      span.setAttribute('bugsnag.navigation.route', currentRoute)
      span.setAttribute('bugsnag.navigation.triggered_by', '@bugsnag/react-navigation-performance')

      if (this.state.previousRoute) {
        span.setAttribute('bugsnag.navigation.previous_route', this.state.previousRoute)
      }

      this.currentSpan = span
      this.endCondition = 'immediate'

      this.setState(prevState => ({
        ...prevState,
        previousRoute: currentRoute
      }))

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
