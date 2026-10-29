import React from 'react'
import { SafeAreaView, StyleSheet, Text } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { launchScenario, launchFromStartupConfig, Scenarios } from '@bugsnag/react-native-performance-scenarios'

console.reportErrorsAsExceptions = false

const isStartupTest = launchFromStartupConfig()

const setScenario = (scenarioContext) => {
  const scenario = Scenarios[scenarioContext.name]
  if (typeof scenario?.registerScreens === 'function') {
    scenario.registerScreens()
  }

  if (typeof scenario?.postInitialise === 'function') {
    scenario.postInitialise()
    return
  }

  if (typeof scenario?.startScenario === 'function') {
    scenario.startScenario()
    return
  }

  Navigation.registerComponent('Scenario', () => scenario.App)
  Navigation.setRoot({
    root: {
      component: {
        name: 'Scenario'
      }
    }
  }).catch((err) => console.error('[Bugsnag] Failed to set scenario root:', err))
}

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text>React Native Performance Test App</Text>
      <Text>react-native-navigation</Text>
    </SafeAreaView>
  )
}

Navigation.registerComponent('App', () => App)

Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setRoot({
    root: {
      component: {
        name: 'App'
      }
    }
  }).catch((err) => console.error('[Bugsnag] Failed to set initial root:', err))
})

if (!isStartupTest) {
  launchScenario(setScenario)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100
  }
})