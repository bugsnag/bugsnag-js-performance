import React, { useEffect, useState } from 'react'
import { AppRegistry, SafeAreaView, StyleSheet, Text } from 'react-native'
import { name as appName } from './app.json'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import {
  launchScenario,
  launchFromStartupConfig,
  ScenarioContext,
  ScenarioComponent
} from '@bugsnag/react-native-performance-scenarios'

const App = () => {
  const [currentScenario, setCurrentScenario] = useState(null)

  useEffect(() => {
    async function initApp() {
      try {
        const startupConfig = await launchFromStartupConfig(setCurrentScenario)

        if (startupConfig) {
          // Initialize JS SDK to close and flush ReactNativeInit span
          if (startupConfig.reactNative) {
            BugsnagPerformance.start(startupConfig.reactNative)
          }

          if (startupConfig.scenario) {
            setCurrentScenario({ name: startupConfig.scenario })
          }
        } else {
          // No startup config saved; await command from Maze Runner
          await launchScenario(setCurrentScenario)
        }
      } catch (error) {
        console.error('Error during startup initialization:', error)
        launchScenario(setCurrentScenario)
      }
    }

    initApp()
  }, [])

  return (
    <ScenarioContext.Provider value={currentScenario}>
      <SafeAreaView style={styles.container}>
        <Text accessibilityLabel="app-component" testID="app-component">
          React Native Performance Test App
        </Text>
        <ScenarioComponent />
      </SafeAreaView>
    </ScenarioContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100
  }
})

AppRegistry.registerComponent(appName, () => App)