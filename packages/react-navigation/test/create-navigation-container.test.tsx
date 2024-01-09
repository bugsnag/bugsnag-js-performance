import BugsnagPerformance from '@bugsnag/react-native-performance'
import { NavigationContainer, type ParamListBase } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import '@testing-library/jest-native/extend-expect'
import { fireEvent, render, screen } from '@testing-library/react-native'
import * as React from 'react'
import { Button, Text, View } from 'react-native'
import { createNavigationContainer } from '../lib/create-navigation-container'

describe('createNavigationContainer', () => {
  it('creates a navigation span when the route changes', () => {
    const BugsnagNavigationContainer = createNavigationContainer(NavigationContainer)

    render(
      <BugsnagNavigationContainer>
        <RootNavigator />
      </BugsnagNavigationContainer>
    )

    fireEvent.press(screen.getByText('Go to route 2'))

    expect(screen.getByText('Route 2')).toBeOnTheScreen()

    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledTimes(1)
    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledWith('Route 2')

    fireEvent.press(screen.getByText('Go back'))

    expect(screen.getByText('Route 1')).toBeOnTheScreen()

    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledTimes(2)
    expect(BugsnagPerformance.startNavigationSpan).toHaveBeenCalledWith('Route 1')
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
