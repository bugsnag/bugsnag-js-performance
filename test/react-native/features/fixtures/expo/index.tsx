import { SafeAreaView, StyleSheet, Text } from 'react-native';
import React, { useEffect, useState } from 'react'

//@ts-expect-error no types
import { launchScenario, ScenarioContext } from '@bugsnag/react-native-performance-scenarios'

export default function HomeScreen() {

  const [currentScenario, setCurrentScenario] = useState<any>(null)

  useEffect(() => {
    launchScenario(setCurrentScenario)
  }, [])

  return (
      <ScenarioContext.Provider value={ currentScenario }>
        <SafeAreaView style={styles.container}>
            <Text accessibilityLabel='app-component' testID='app-component'>Expo Performance Test App</Text>
            { currentScenario && <currentScenario.Component /> }
          </SafeAreaView>
      </ScenarioContext.Provider>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 100,
  }
})
