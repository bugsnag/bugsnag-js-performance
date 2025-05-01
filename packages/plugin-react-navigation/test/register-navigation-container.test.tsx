import type { AppState } from '@bugsnag/core-performance'
import { MockReactNativeSpanFactory } from '@bugsnag/js-performance-test-utilities'
import type { ReactNativeConfiguration, ReactNativeSpanFactory } from '@bugsnag/react-native-performance'
import type { ParamListBase } from '@react-navigation/native'
import { NavigationContainer, createNavigationContainerRef, useNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import '@testing-library/jest-native/extend-expect'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Button, Text, View } from 'react-native'
import { createNavigationContainer } from '../lib/create-navigation-container'
import { NavigationTracker } from '../lib/navigation-tracker'
import BugsnagPluginReactNavigationNativePerformance from '../lib/react-navigation-native-plugin'
import { useEffect } from 'react'

let appState: AppState = 'starting'
let spanFactory = new MockReactNativeSpanFactory()
let plugin = new BugsnagPluginReactNavigationNativePerformance()

const setAppState = jest.fn((state: AppState) => {
  appState = state
})

beforeEach(() => {
  jest.useFakeTimers()
  appState = 'starting'
  setAppState.mockReset()
  spanFactory = new MockReactNativeSpanFactory()
  plugin = new BugsnagPluginReactNavigationNativePerformance()
})

afterEach(() => {
  jest.useRealTimers()
})

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('registerNavigationContainer', () => {
  it('creates a navigation span when the route changes', async () => {
    plugin.configure({} as unknown as ReactNativeConfiguration, spanFactory, setAppState)

    render(
        <App />
    )

    expect(screen.getByText('Route 1')).toBeOnTheScreen()
    fireEvent.press(screen.getByText('Go to route 2'))
    expect(screen.getByText('Route 2')).toBeOnTheScreen()

    // await delay(500)

    jest.advanceTimersByTime(200)

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

function App () {
  const ref = useNavigationContainerRef()

  useEffect(() => {
    plugin.registerNavigationContainerRef(ref)
  }, [ref])

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  )
}
