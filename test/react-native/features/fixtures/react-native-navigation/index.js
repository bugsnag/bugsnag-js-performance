import { launchScenario, launchFromStartupConfig, Scenarios } from '@bugsnag/react-native-performance-scenarios'
import { useEffect, useState } from 'react'
import { SafeAreaView, StyleSheet, Text } from 'react-native'
import { Navigation } from 'react-native-navigation'

console.reportErrorsAsExceptions = false

const isStartupTest = launchFromStartupConfig()

const setScenario = (scenarioContext) => {
  const scenario = Scenarios[scenarioContext.name]
  if (typeof scenario.registerScreens === 'function') {
      scenario.registerScreens()
      return
  }

  Navigation.registerComponent('Scenario', () => scenario.App)
    Navigation.setRoot({
      root: {
        component: {
          name: 'Scenario'
        }
      }
    })
}


const App = () => {
    useEffect(() => {
        if (!isStartupTest) launchScenario(setScenario)
    }, [])

    return (
        <SafeAreaView style={styles.container}>
            <Text>React Native Performance Test App</Text>
            <Text>react-native-navigation</Text>
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
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 100
    }
})
