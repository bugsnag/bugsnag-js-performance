import type { NavigationContainerProps, NavigationContainerRefWithCurrent } from '@react-navigation/native'
import { useNavigationContainerRef, NavigationContainer } from '@react-navigation/native'
import React, { forwardRef } from 'react'
import type { NavigationTracker } from './navigation-tracker'

type CreateNavigationContainer = (NavigationContainerComponent: typeof NavigationContainer, navigationTracker: NavigationTracker) => typeof NavigationContainer
type NavigationContainerRef = NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>

export const createNavigationContainer: CreateNavigationContainer = (NavigationContainerComponent = NavigationContainer, navigationTracker: NavigationTracker) => {
  return forwardRef<NavigationContainerRef, NavigationContainerProps>((props, _ref) => {
    const navigationContainerRef = _ref as NavigationContainerRef || useNavigationContainerRef()

    navigationTracker.configure(navigationContainerRef)

    return (
        <NavigationContainerComponent
          {...props}
          ref={navigationContainerRef}
        />
    )
  }) as typeof NavigationContainerComponent
}
