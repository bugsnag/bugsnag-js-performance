import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { NativeScenarioLauncher } from '../../lib/native'
import BugsnagPerformance from '@bugsnag/react-native-performance'

export const initialise = async (config) => {
const startupConfig = {
  scenario: 'AppStartScenario',
  native: {
    apiKey: config.apiKey,
    endpoint: config.endpoint,
    autoInstrumentAppStarts: true,
    autoInstrumentViewLoads: false
  },
  reactNative: {
    apiKey: config.apiKey,
    endpoint: config.endpoint,
    autoInstrumentAppStarts: true,
    maximumBatchSize: 1
  }
}

  await NativeScenarioLauncher.saveStartupConfig(startupConfig)
  await NativeScenarioLauncher.exitApp()
}

export const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>AppStartScenario</Text>
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