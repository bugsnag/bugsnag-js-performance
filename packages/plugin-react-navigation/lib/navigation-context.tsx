import type { PropsWithChildren } from 'react'

import React from 'react'
import type { NavigationTracker } from './navigation-tracker'

export const NavigationContext = React.createContext({
  blockNavigationEnd: () => {},
  unblockNavigationEnd: (condition: EndCondition) => {},
  triggerNavigationEnd: () => {}
})

interface Props extends PropsWithChildren {
  currentRoute?: string
  navigationTracker: NavigationTracker
}

type EndCondition = 'condition' | 'mount' | 'unmount' | 'immediate'

export class NavigationContextProvider extends React.Component<Props> {
  private timerRef?: NodeJS.Timeout
  private lastRenderTime = 0
  private componentsLoading = 0
  private endCondition: EndCondition = 'immediate'

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
      if (this.componentsLoading === 0) {
        const endTime = Math.max(this.lastRenderTime, triggerNavigationEndTime)
        if (this.props.navigationTracker.completeNavigation(endTime, this.endCondition)) {
          this.lastRenderTime = 0
        }
      }
    }, 100)
  }

  componentDidUpdate (prevProps: Props) {
    const { currentRoute, navigationTracker } = this.props
    if (currentRoute && currentRoute !== prevProps.currentRoute) {
      navigationTracker.handleRouteChange(currentRoute)
      this.endCondition = 'immediate'

      setTimeout(() => { this.triggerNavigationEnd() })
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
