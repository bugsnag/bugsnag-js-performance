import { launchScenario, launchFromStartupConfig, ScenarioContext, ScenarioComponent } from '@bugsnag/react-native-performance-scenarios'
import { useEffect, useState } from 'react'
import { SafeAreaView, StyleSheet, Text } from 'react-native'
import { Navigation } from 'react-native-navigation'

console.reportErrorsAsExceptions = false

const isStartupTest = launchFromStartupConfig()

const App = () => {
    const [currentScenario, setCurrentScenario] = useState(null)

    useEffect(() => {
        if (!isStartupTest) launchScenario(setCurrentScenario)
    }, [])

    return (
        <ScenarioContext.Provider value={ currentScenario }>
            <SafeAreaView style={styles.container}>
                <Text>React Native Performance Test App</Text>
                <Text>react-native-navigation</Text>
                <ScenarioComponent />
            </SafeAreaView>
        </ScenarioContext.Provider>
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
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 100
    }
})
