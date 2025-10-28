import * as AppState from '@bugsnag/core-performance/lib/app-state'
import type { ParamListBase } from '@react-navigation/native'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import '@testing-library/jest-native/extend-expect'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Button, Text, View } from 'react-native'
import { createNavigationContainer } from '../lib/create-navigation-container'
import { NavigationTracker } from '../lib/navigation-tracker'
import BugsnagPerformance from '@bugsnag/react-native-performance'

jest.spyOn(AppState, 'setAppState')

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  AppState.setAppState('starting')
  jest.clearAllMocks()
  jest.useRealTimers()
})

describe('createNavigationContainer', () => {
  it('creates a navigation span when the route changes', () => {
    const navigationTracker = new NavigationTracker()
    const BugsnagNavigationContainer = createNavigationContainer(NavigationContainer, navigationTracker)

    render(
      <BugsnagNavigationContainer>
        <RootNavigator />
      </BugsnagNavigationContainer>
    )

    fireEvent.press(screen.getByText('Go to route 2'))
    expect(screen.getByText('Route 2')).toBeOnTheScreen()

    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledTimes(1)
    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledWith('Route 2', { startTime: 0 })
    expect(AppState.setAppState).toHaveBeenCalled()
    expect(AppState.getAppState()).toBe('navigating')

    fireEvent.press(screen.getByText('Go back'))
    expect(screen.getByText('Route 1')).toBeOnTheScreen()

    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledTimes(2)
    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledWith('Route 1', { startTime: 0 })
    expect(AppState.setAppState).toHaveBeenCalledTimes(2)
  })

  it('forwards the provided ref to the NavigationContainer', () => {
    const navigationRef = createNavigationContainerRef()
    const navigationTracker = new NavigationTracker()
    const BugsnagNavigationContainer = createNavigationContainer(NavigationContainer, navigationTracker)

    render(
      <BugsnagNavigationContainer ref={navigationRef}>
        <RootNavigator />
      </BugsnagNavigationContainer>
    )

    act(() => {
      // @ts-expect-error navigate method expects type 'never'
      navigationRef.navigate('Route 2')
    })

    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledTimes(1)
    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledWith('Route 2', { startTime: 0 })
    expect(AppState.setAppState).toHaveBeenCalledTimes(1)
    expect(AppState.getAppState()).toBe('navigating')
  })
})

interface RootStackParamList extends ParamListBase {
  Route1: undefined
  Route2: undefined
}
const Stack = createNativeStackNavigator<RootStackParamList>()
function RootNavigator () {
  return (
    <Stack.Navigator initialRouteName='Route 1' screenOptions={{ headerShown: false }}>
      <Stack.Screen name='Route 1'>
        {({ navigation }) => (
          <View>
            <Text>Route 1</Text>
            <Button title='Go to route 2' onPress={() => { navigation.navigate('Route 2') }} />
          </View>
        )}
      </Stack.Screen>
      <Stack.Screen name='Route 2'>
        {({ navigation }) => (
          <View>
            <Text>Route 2</Text>
            <Button title='Go back' onPress={() => { navigation.goBack() }} />
          </View>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  )
}
