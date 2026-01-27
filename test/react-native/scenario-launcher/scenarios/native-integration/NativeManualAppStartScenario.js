import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { NativeScenarioLauncher } from '../../lib/native'

export const withInstrumentedAppStarts = true

export const initialise = async (config) => {
  const startupConfig = {
    reactNative: {
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      autoInstrumentAppStarts: false,
      autoInstrumentNetworkRequests: false,
      maximumBatchSize: 1,
      attach: true,
      scenario: 'NativeManualAppStartScenario'
    },
    native: {
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      autoInstrumentAppStarts: true,
      autoInstrumentViewLoads: true,
    }
  }

  NativeScenarioLauncher.saveStartupConfig(startupConfig)
  NativeScenarioLauncher.exitApp()
}

export const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>NativeManualAppStartScenario</Text>
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
