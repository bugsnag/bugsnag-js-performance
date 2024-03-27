import BugsnagPerformance from '@bugsnag/react-native-performance'
import BugsnagPluginReactNavigationPerformance, { CompleteNavigation } from '@bugsnag/plugin-react-navigation-performance'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { SafeAreaView, Text } from 'react-native'

export const config = {
    maximumBatchSize: 5,
    autoInstrumentAppStarts: false,
    appVersion: '1.2.3',
    plugins: [new BugsnagPluginReactNavigationPerformance()]
}

const Stack = createNativeStackNavigator()

let parentSpan

export function App() {

    // These methods must be called after Bugsnag has been started
    const plugin = BugsnagPerformance.getPlugin(BugsnagPluginReactNavigationPerformance)
    const BugsnagNavigationContainer = plugin.createNavigationContainer()

    return (
        <BugsnagNavigationContainer>
            <Stack.Navigator initialRouteName='Screen1'>
                <Stack.Screen name='Screen1' component={Screen1} />
                <Stack.Screen name='Screen2' component={Screen2} />
                <Stack.Screen name='Screen3' component={Screen3} />
                <Stack.Screen name='Screen4' component={Screen4} />
                <Stack.Screen name='Screen5' component={Screen5} />
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

// End navigation immediately
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

// End navigation with CompleteNavigation component on condition
function Screen3({ navigation }) {
    const [loadingComplete, setLoadingComplete] = useState(false)

    useEffect(() => {
        setTimeout(() => {
            setLoadingComplete(true)
        }, 50)

        setTimeout(() => {
            navigation.navigate('Screen4')
        }, 250)
    }, [])

    return (
        <SafeAreaView>
            <Text>Screen3</Text>
            <CompleteNavigation on={loadingComplete} />
        </SafeAreaView>
    )
}

// End navigation with CompleteNavigation component on mount
function Screen4({ navigation }) {
    const [loadingComplete, setLoadingComplete] = useState(false)

    useEffect(() => {
        setTimeout(() => {
            setLoadingComplete(true)
        }, 50)

        setTimeout(() => {
            navigation.navigate('Screen5')
        }, 250)
    }, [])

    return (
        <SafeAreaView>
            <Text>Screen4</Text>
            {loadingComplete ? <CompleteNavigation on="mount" /> : null}
        </SafeAreaView>
    )
}

// End navigation with CompleteNavigation component on unmount
function Screen5() {
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setTimeout(() => {
            setLoading(false)
        }, 50)

        setTimeout(() => {
            if (parentSpan && typeof parentSpan.end === 'function') {
                parentSpan.end()
            }
        }, 250)
    }, [])

    return (
        <SafeAreaView>
            <Text>Screen5</Text>
            {loading ? <CompleteNavigation on="unmount" /> : null}
        </SafeAreaView>
    )
}
