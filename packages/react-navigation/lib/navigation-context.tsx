import type { SpanFactory, SpanInternal } from '@bugsnag/core-performance'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import React, { type PropsWithChildren } from 'react'

export const NavigationContext = React.createContext({
  blockNavigationEnd: () => {},
  unblockNavigationEnd: () => {},
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

const DISCARDED = -1

export class NavigationContextProvider extends React.Component<Props, State> {
  private currentSpan?: SpanInternal
  private timerRef?: NodeJS.Timeout

  state = {
    previousRoute: undefined,
    componentsLoading: 0,
    lastRenderTime: performance.now()
  }

  blockNavigationEnd = () => {
    this.setState(prevState => ({
      ...prevState,
      componentsLoading: prevState.componentsLoading + 1,
      lastRenderTime: 0
    }))
  }

  unblockNavigationEnd = () => {
    this.setState(prevState => ({
      ...prevState,
      componentsLoading: Math.max(prevState.componentsLoading - 1, 0),
      lastRenderTime: performance.now()
    }), () => {
      if (this.state.componentsLoading === 0) {
        this.triggerNavigationEnd()
      }
    })
  }

  triggerNavigationEnd = () => {
    clearTimeout(this.timerRef)

    this.timerRef = setTimeout(() => {
      if (this.state.componentsLoading === 0 && this.currentSpan) {
        this.currentSpan.setAttribute('bugsnag.span.category', 'navigation')

        this.props.spanFactory.endSpan(this.currentSpan, this.state.lastRenderTime)
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

      this.currentSpan = spanFactory.startSpan(`[Navigation]${currentRoute}`, {
        isFirstClass: false,
        makeCurrentContext: true,
        parentContext: null
      })

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
