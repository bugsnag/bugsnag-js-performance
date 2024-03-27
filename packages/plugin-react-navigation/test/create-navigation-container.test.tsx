import { MockSpanFactory } from '@bugsnag/js-performance-test-utilities'
import { type ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import { NavigationContainer, createNavigationContainerRef, type ParamListBase } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import '@testing-library/jest-native/extend-expect'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'
import { Button, Text, View } from 'react-native'
import { createNavigationContainer } from '../lib/create-navigation-container'

describe('createNavigationContainer', () => {
  it('creates a navigation span when the route changes', () => {
    const spanFactory = new MockSpanFactory<ReactNativeConfiguration>()
    const BugsnagNavigationContainer = createNavigationContainer(NavigationContainer, spanFactory)

    render(
      <BugsnagNavigationContainer>
        <RootNavigator />
      </BugsnagNavigationContainer>
    )

    fireEvent.press(screen.getByText('Go to route 2'))
    expect(screen.getByText('Route 2')).toBeOnTheScreen()

    expect(spanFactory.startSpan).toHaveBeenCalledTimes(1)
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[Navigation]Route 2', { isFirstClass: true })

    fireEvent.press(screen.getByText('Go back'))
    expect(screen.getByText('Route 1')).toBeOnTheScreen()

    expect(spanFactory.startSpan).toHaveBeenCalledTimes(2)
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[Navigation]Route 1', { isFirstClass: true })
  })

  it('forwards the provided ref to the NavigationContainer', () => {
    const navigationRef = createNavigationContainerRef()
    const spanFactory = new MockSpanFactory<ReactNativeConfiguration>()
    const BugsnagNavigationContainer = createNavigationContainer(NavigationContainer, spanFactory)

    render(
      <BugsnagNavigationContainer ref={navigationRef}>
        <RootNavigator />
      </BugsnagNavigationContainer>
    )

    act(() => {
      // @ts-expect-error navigate method expects type 'never'
      navigationRef.navigate('Route 2')
    })

    expect(spanFactory.startSpan).toHaveBeenCalledTimes(1)
    expect(spanFactory.startSpan).toHaveBeenCalledWith('[Navigation]Route 2', { isFirstClass: true })
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
