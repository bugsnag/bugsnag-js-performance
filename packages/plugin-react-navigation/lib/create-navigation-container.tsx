import type { NavigationContainerRefWithCurrent } from '@react-navigation/native'
import { useNavigationContainerRef, NavigationContainer } from '@react-navigation/native'
import React from 'react'
import type { NavigationTracker } from './navigation-tracker'

type CreateNavigationContainer = (NavigationContainerComponent: typeof NavigationContainer, navigationTracker: NavigationTracker) => typeof NavigationContainer
type NavigationContainerRef = NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>

export const createNavigationContainer: CreateNavigationContainer = (NavigationContainerComponent = NavigationContainer, navigationTracker: NavigationTracker) => {
  return React.forwardRef<NavigationContainerRef, React.ComponentPropsWithoutRef<typeof NavigationContainer>>((props, ref) => {
    const navigationContainerRef = ref as NavigationContainerRef || useNavigationContainerRef()

    const wrappedOnReady = () => {
      navigationTracker.configure(navigationContainerRef)
      if (typeof props.onReady === 'function') {
        props.onReady()
      }
    }

    return (
      <NavigationContainerComponent
        {...props}
        ref={navigationContainerRef}
        onReady={wrappedOnReady}
      />
    )
  }) as typeof NavigationContainerComponent
}
