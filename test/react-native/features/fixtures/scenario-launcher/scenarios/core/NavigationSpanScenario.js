import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import BugsnagPerformance from '@bugsnag/react-native-performance'

export const initialise = async (config) => {
  config.maximumBatchSize = 1
}

export const App = () => {
  useEffect(() => {
    BugsnagPerformance.startNavigationSpan('NavigationSpanScenario').end()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>NavigationSpanScenario</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scenario: {
    flex: 1
  }
})
