import BugsnagPerformance from '@bugsnag/react-native-performance'
import { ReactNavigationNativePlugin } from '@bugsnag/react-navigation-performance'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { Button, SafeAreaView, Text } from 'react-native'

export const config = {
    maximumBatchSize: 1,
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
            <Stack.Navigator initialRouteName='Home'>
                <Stack.Screen name='Home' component={HomeScreen} />
                <Stack.Screen name='Details' component={DetailsScreen} />
            </Stack.Navigator>
        </BugsnagNavigationContainer>
    );
}

function HomeScreen({ navigation }) {
    const { startSpan } = useParentSpan()

    useEffect(() => {
        parentSpan = startSpan('ParentSpan')
        navigation.navigate('Details')
    }, [])

    return (
        <SafeAreaView>
            <Text>HomeScreen</Text>
            <Button title='Go to details screen' onPress={() => { navigation.navigate('Details') }} />
        </SafeAreaView>
    )
}

function DetailsScreen({ navigation }) {
    useEffect(() => {
        setTimeout(() => {
            parentSpan.end()
        }, 250)
    }, [])

    return (
        <SafeAreaView>
            <Text>DetailsScreen</Text>
            <Button title='Go back' onPress={() => { navigation.goBack() }} />
        </SafeAreaView>
    )
}
