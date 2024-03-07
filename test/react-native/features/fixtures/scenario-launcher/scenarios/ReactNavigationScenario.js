import BugsnagPerformance from '@bugsnag/react-native-performance'
import { ReactNavigationNativePlugin } from '@bugsnag/react-navigation-performance'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { SafeAreaView, Text, Button } from 'react-native'

export const config = {
    maximumBatchSize: 2,
    appVersion: '1.2.3',
    plugins: [new ReactNavigationNativePlugin()]
}

const Stack = createNativeStackNavigator()

export function App() {

    // These methods must be called after Bugsnag has been started
    const plugin = BugsnagPerformance.getPlugin(ReactNavigationNativePlugin)
    const BugsnagNavigationContainer = plugin.createNavigationContainer()

    return (
        <BugsnagNavigationContainer>
            <Stack.Navigator initialRouteName='Home'>
                <Stack.Screen name='Home' component={HomeScreen} />
                <Stack.Screen name='Loading' component={LoadingScreen} />
                <Stack.Screen name='Details' component={DetailsScreen} />
            </Stack.Navigator>
        </BugsnagNavigationContainer>
    );
}

function HomeScreen({ navigation }) {
    useEffect(() => {
        navigation.navigate('Details')
    }, [])

    return (
        <SafeAreaView>
            <Text>HomeScreen</Text>
            <Button title='Go to details screen' onPress={() => { navigation.navigate('Details') }} />
            <Button title='Go to loading screen' onPress={() => { navigation.navigate('Loading') }} />
        </SafeAreaView>
    )
}

function LoadingScreen({ navigation }) {
    return (
        <SafeAreaView>
            <Text>LoadingScreen</Text>
            <Button title='Go back' onPress={() => { navigation.goBack() }} />
            <Button title='Go to home screen' onPress={() => { navigation.navigate('Home') }} />
            <Button title='Go to details screen' onPress={() => { navigation.navigate('Details') }} />
        </SafeAreaView>
    )
}

function DetailsScreen({ navigation }) {
    return (
        <SafeAreaView>
            <Text>DetailsScreen</Text>
            <Button title='Go back' onPress={() => { navigation.goBack() }} />
            <Button title='Go to home screen' onPress={() => { navigation.navigate('Home') }} />
            <Button title='Go to loading screen' onPress={() => { navigation.navigate('Loading') }} />
        </SafeAreaView>
    )
}
