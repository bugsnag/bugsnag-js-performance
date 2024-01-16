import type { BugsnagPerformance, Span } from '@bugsnag/core-performance'
import type { PlatformExtensions, ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import React, { type PropsWithChildren } from 'react'

export const NavigationContext = React.createContext({
  blockNavigationEnd: () => {},
  unblockNavigationEnd: () => {},
  triggerNavigationEnd: () => {}
})

interface Props extends PropsWithChildren {
  currentRoute?: string
  client: BugsnagPerformance<ReactNativeConfiguration, PlatformExtensions>
}

interface State {
  componentsLoading: number
  previousRoute?: string
  lastRenderTime: number
}

const DISCARDED = -1

export class NavigationContextProvider extends React.Component<Props, State> {
  private currentSpan: Span | undefined
  private timerRef: NodeJS.Timeout | undefined

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
        this.currentSpan.end(this.state.lastRenderTime)
        this.currentSpan = undefined
      }
    }, 100)
  }

  componentDidUpdate (prevProps: Props) {
    const { currentRoute, client } = this.props

    if (currentRoute && currentRoute !== prevProps.currentRoute) {
      // If there is already an active navigation span, end it with an
      // invalid time to cause it to be discarded from the context stack.
      if (this.currentSpan) {
        this.currentSpan.end(DISCARDED)
      }

      this.currentSpan = client.startNavigationSpan(currentRoute)

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
