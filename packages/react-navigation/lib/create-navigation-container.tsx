import BugsnagPerformance from '@bugsnag/react-native-performance'
import { NavigationContainer, type NavigationContainerProps, type NavigationContainerRef, useNavigationContainerRef } from '@react-navigation/native'
import React, { forwardRef, useRef } from 'react'
import { NavigationContextProvider } from './navigation-context'

type EmptyObject = Record<string, unknown>

export const createNavigationContainer = <P extends EmptyObject>(Container = NavigationContainer) =>
  forwardRef<NavigationContainerRef<P>, NavigationContainerProps>(
    (props, _ref) => {
      const { onStateChange, ...rest } = props

      const navigationContainerRef = useNavigationContainerRef()
      const [routeName, setRouteName] = React.useState<string>()
      const routeNameRef = useRef<string>()

      const wrappedOnStateChange: typeof onStateChange = (...args) => {
        const currentRoute = navigationContainerRef.current
          ? navigationContainerRef.current.getCurrentRoute()
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
        <NavigationContextProvider client={BugsnagPerformance} currentRoute={routeName}>
          <Container
            {...rest}
            onStateChange={wrappedOnStateChange}
            ref={navigationContainerRef}
          />
        </NavigationContextProvider>
      )
    }
  )
