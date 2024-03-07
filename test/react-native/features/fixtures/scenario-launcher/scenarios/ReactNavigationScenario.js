import BugsnagPerformance from '@bugsnag/react-native-performance'
import { ReactNavigationNativePlugin } from '@bugsnag/react-navigation-performance'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { SafeAreaView, Text } from 'react-native'

export const config = {
    maximumBatchSize: 3,
    autoInstrumentAppStarts: false,
    appVersion: '1.2.3',
    plugins: [new ReactNavigationNativePlugin()]
}

const Stack = createNativeStackNavigator()

let parentSpan

export function App() {

    // These methods must be called after Bugsnag has been started
    const plugin = BugsnagPerformance.getPlugin(ReactNavigationNativePlugin)
    const BugsnagNavigationContainer = plugin.createNavigationContainer()

    return (
        <BugsnagNavigationContainer>
            <Stack.Navigator initialRouteName='Screen1'>
                <Stack.Screen name='Screen1' component={Screen1} />
                <Stack.Screen name='Screen2' component={Screen2} />
                <Stack.Screen name='Screen3' component={Screen3} />
            </Stack.Navigator>
        </BugsnagNavigationContainer>
    );
}

function Screen1({ navigation }) {
    useEffect(() => {
        parentSpan = BugsnagPerformance.startSpan('ParentSpan')
        navigation.navigate('Screen2')
    }, [])

    return (
        <SafeAreaView>
            <Text>Screen1</Text>
        </SafeAreaView>
    )
}

function Screen2({ navigation }) {
    useEffect(() => {
        setTimeout(() => {
            navigation.navigate('Screen3')
        }, 250)
    }, [])

    return (
        <SafeAreaView>
            <Text>Screen2</Text>
        </SafeAreaView>
    )
}

function Screen3({ navigation }) {
    useEffect(() => {
        setTimeout(() => {
            if(parentSpan && typeof parentSpan.end === 'function') {
                parentSpan.end()
            }
        }, 250)
    }, [])

    return (
        <SafeAreaView>
            <Text>Screen3</Text>
        </SafeAreaView>
    )
}
