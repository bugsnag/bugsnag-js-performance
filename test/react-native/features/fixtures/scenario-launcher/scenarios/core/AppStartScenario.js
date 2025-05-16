import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { NativeScenarioLauncher } from '../../lib/native'

export const initialise = async (config) => {
  const startupConfig = {
    apiKey: config.apiKey,
    endpoint: config.endpoint,
    autoInstrumentAppStarts: true,
    autoInstrumentNetworkRequests: false,
    maximumBatchSize: 1
  }

  NativeScenarioLauncher.saveStartupConfig(startupConfig)
  NativeScenarioLauncher.exitApp()
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
