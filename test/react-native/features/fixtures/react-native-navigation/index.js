import { launchScenario, NativeScenarioLauncher } from '@bugsnag/react-native-performance-scenarios'
import { useContext, useEffect } from 'react'
import { RootTagContext, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { Navigation } from 'react-native-navigation'
import BugsnagPerformance from '@bugsnag/react-native-performance';

console.reportErrorsAsExceptions = false

const startupConfig = NativeScenarioLauncher.readStartupConfig()
if (startupConfig) {
  BugsnagPerformance.start(startupConfig)
}

const App = () => {
    const rootTag = useContext(RootTagContext)

    useEffect(() => {
        if (!startupConfig) launchScenario(rootTag)
    }, [rootTag])

    return (
        <SafeAreaView style={styles.container}>
            <View>
                <Text>React Native Performance Test App</Text>
                <Text>react-native-navigation</Text>
            </View>
        </SafeAreaView>
    )
}

Navigation.registerComponent('App', () => App)
Navigation.events().registerAppLaunchedListener(async () => {
    Navigation.setRoot({
        root: {
            component: {
                name: 'App'
            }
        }
    })
})

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})
