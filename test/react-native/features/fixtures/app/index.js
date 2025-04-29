import { AppRegistry, SafeAreaView, StyleSheet, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { name as appName } from './app.json';
import { launchScenario, launchFromStartupConfig, ScenarioContext } from '@bugsnag/react-native-performance-scenarios'

const isStartupTest = launchFromStartupConfig()

const App = () => {

  const [currentScenario, setCurrentScenario] = useState(null)

  useEffect(() => {
    if (!isStartupTest) launchScenario(setCurrentScenario)
  }, [])

  return (
    <ScenarioContext.Provider value={ currentScenario }>
      <SafeAreaView style={styles.container}>
          <Text accessibilityLabel='app-component' testID='app-component'>React Native Performance Test App</Text>
          { currentScenario && <currentScenario.Component /> }
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

AppRegistry.registerComponent(appName, () => App);