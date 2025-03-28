import type { SetAppState } from '@bugsnag/core-performance'
import type { ReactNativeSpanFactory } from '@bugsnag/react-native-performance'
import type { NavigationContainerProps, NavigationContainerRefWithCurrent } from '@react-navigation/native'
import { useNavigationContainerRef, NavigationContainer } from '@react-navigation/native'
import React, { forwardRef, useRef } from 'react'
import { NavigationContextProvider } from './navigation-context'

// Prevent rollup plugin from tree shaking NavigationContextProvider
const Provider = NavigationContextProvider

type CreateNavigationContainer = (NavigationContainerComponent: typeof NavigationContainer, spanFactory: ReactNativeSpanFactory, setAppState: SetAppState) => typeof NavigationContainer
type NavigationContainerRef = NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>

export const createNavigationContainer: CreateNavigationContainer = (NavigationContainerComponent = NavigationContainer, spanFactory: ReactNativeSpanFactory, setAppState) => {
  return forwardRef<NavigationContainerRef, NavigationContainerProps>((props, _ref) => {
    const { onStateChange, ...rest } = props

    const navigationContainerRef = _ref as NavigationContainerRef || useNavigationContainerRef()
    const [routeName, setRouteName] = React.useState<string>()
    const routeNameRef = useRef<string>()

    const wrappedOnStateChange: typeof onStateChange = (...args) => {
      const currentRoute = navigationContainerRef
        ? navigationContainerRef.current
          ? navigationContainerRef.current.getCurrentRoute()
          : navigationContainerRef.getCurrentRoute()
        : null

      if (currentRoute) {
        routeNameRef.current = currentRoute.name
        setRouteName(currentRoute.name)
      }

      if (typeof onStateChange === 'function') {
        onStateChange.apply(this, args)
      }
    }

    return (
      <Provider spanFactory={spanFactory} currentRoute={routeName} setAppState={setAppState}>
        <NavigationContainerComponent
          {...rest}
          onStateChange={wrappedOnStateChange}
          ref={navigationContainerRef}
        />
      </Provider>
    )
  }) as typeof NavigationContainerComponent
}
