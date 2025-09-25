import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import BugsnagPerformance, { AppStartSpanQuery } from '@bugsnag/react-native-performance'
import { App as AppStartSpanControlScenario } from './AppStartSpanControlScenario'

export const withInstrumentedAppStarts = true

export const initialise = async (config) => {
  config.maximumBatchSize = 1
}

export const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>ManualCustomAppStartScenario</Text>
        <AppStartSpanControlScenario />
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
