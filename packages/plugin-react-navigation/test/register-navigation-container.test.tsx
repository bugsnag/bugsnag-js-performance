import type { AppState } from '@bugsnag/core-performance'
import { MockReactNativeSpanFactory } from '@bugsnag/js-performance-test-utilities'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import type { ParamListBase } from '@react-navigation/native'
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import '@testing-library/jest-native/extend-expect'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Button, Text, View } from 'react-native'
import BugsnagPluginReactNavigationNativePerformance from '../lib/react-navigation-native-plugin'
import { useEffect } from 'react'

let plugin = new BugsnagPluginReactNavigationNativePerformance()

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
  plugin = new BugsnagPluginReactNavigationNativePerformance()
})

describe('registerNavigationContainer', () => {
  it('creates a navigation span when the route changes', () => {
    let appState: AppState = 'starting'
    const setAppState = jest.fn((state: AppState) => {
      appState = state
    })
    const spanFactory = new MockReactNativeSpanFactory()
    plugin.configure({} as unknown as ReactNativeConfiguration, spanFactory, setAppState)

    render(
        <App />
    )

    expect(screen.getByText('Route 1')).toBeOnTheScreen()
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
    <NavigationContainer ref={ref}>
      <RootNavigator />
    </NavigationContainer>
  )
}
