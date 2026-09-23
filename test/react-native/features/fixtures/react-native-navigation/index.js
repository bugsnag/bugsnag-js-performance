import React, { useEffect } from 'react'
import { SafeAreaView, StyleSheet, Text } from 'react-native'
import { Navigation } from 'react-native-navigation'
import { launchScenario, launchFromStartupConfig, Scenarios } from '@bugsnag/react-native-performance-scenarios'

console.reportErrorsAsExceptions = false

// Check if launched from a saved startup config (e.g. cold relaunch in AppStartScenario)
const isStartupTest = launchFromStartupConfig()

const setScenario = (scenarioContext) => {
  const scenario = Scenarios[scenarioContext.name]
  if (typeof scenario?.registerScreens === 'function') {
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

// 1. Register base component immediately
Navigation.registerComponent('App', () => App)

// 2. Set root on app launch
Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setRoot({
    root: {
      component: {
        name: 'App'
      }
    }
  }).catch((err) => console.error('[Bugsnag] Failed to set initial root:', err))
})

// 3. Always trigger launchScenario outside the listener so command polling starts reliably
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