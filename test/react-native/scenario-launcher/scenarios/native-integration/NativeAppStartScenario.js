import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { NativeScenarioLauncher } from '../../lib/native'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const initialise = async (config) => {
  const startupConfig = {
    apiKey: config.apiKey,
    endpoint: config.endpoint,
    autoInstrumentAppStarts: true,
    maximumBatchSize: 1,
    batchInactivityTimeoutMs: 1000
  }

  await NativeScenarioLauncher.saveStartupConfig(startupConfig)
  await delay(250) // Allow synchronous disk flush before terminating
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