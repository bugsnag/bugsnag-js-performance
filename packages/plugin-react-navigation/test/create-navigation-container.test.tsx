import type { AppState } from '@bugsnag/core-performance'
import { MockReactNativeSpanFactory } from '@bugsnag/js-performance-test-utilities'
import type { ReactNativeSpanFactory } from '@bugsnag/react-native-performance'
import type { ParamListBase } from '@react-navigation/native'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import '@testing-library/jest-native/extend-expect'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Button, Text, View } from 'react-native'
import { createNavigationContainer } from '../lib/create-navigation-container'

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('createNavigationContainer', () => {
  it('creates a navigation span when the route changes', () => {
    let appState: AppState = 'starting'
    const setAppState = jest.fn((state: AppState) => {
      appState = state
    })
    const spanFactory = new MockReactNativeSpanFactory()
    const BugsnagNavigationContainer = createNavigationContainer(NavigationContainer, spanFactory as unknown as ReactNativeSpanFactory, setAppState)

    render(
      <BugsnagNavigationContainer>
        <RootNavigator />
      </BugsnagNavigationContainer>
    )

    fireEvent.press(screen.getByText('Go to route 2'))
    expect(screen.getByText('Route 2')).toBeOnTheScreen()

    expect(spanFactory.startNavigationSpan).toHaveBeenCalledTimes(1)
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('Route 2', { isFirstClass: true, startTime: 0, doNotDelegateToNativeSDK: true })
    expect(setAppState).toHaveBeenCalled()
    expect(appState).toBe('navigating')

    fireEvent.press(screen.getByText('Go back'))
    expect(screen.getByText('Route 1')).toBeOnTheScreen()

    expect(spanFactory.startNavigationSpan).toHaveBeenCalledTimes(2)
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('Route 1', { isFirstClass: true, startTime: 0, doNotDelegateToNativeSDK: true })
    expect(setAppState).toHaveBeenCalledTimes(2)
  })

  it('forwards the provided ref to the NavigationContainer', () => {
    let appState: AppState = 'starting'
    const setAppState = jest.fn((state: AppState) => {
      appState = state
    })
    const navigationRef = createNavigationContainerRef()
    const spanFactory = new MockReactNativeSpanFactory()
    const BugsnagNavigationContainer = createNavigationContainer(NavigationContainer, spanFactory as unknown as ReactNativeSpanFactory, setAppState)

    render(
      <BugsnagNavigationContainer ref={navigationRef}>
        <RootNavigator />
      </BugsnagNavigationContainer>
    )

    act(() => {
      // @ts-expect-error navigate method expects type 'never'
      navigationRef.navigate('Route 2')
    })

    expect(spanFactory.startNavigationSpan).toHaveBeenCalledTimes(1)
    expect(spanFactory.startNavigationSpan).toHaveBeenCalledWith('Route 2', { isFirstClass: true, startTime: 0, doNotDelegateToNativeSDK: true })
    expect(setAppState).toHaveBeenCalledTimes(1)
    expect(appState).toBe('navigating')
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
