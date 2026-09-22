import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { NativeScenarioLauncher } from '../../lib/native'

export const initialise = async (config) => {
  // Derive the sampling endpoint from config or fallback by replacing /traces with /sampling
  const endpoint = config.endpoint
  const samplingEndpoint = config.samplingEndpoint ||
    config.sampling_endpoint ||
    (endpoint ? endpoint.replace(/\/traces\/?$/, '/sampling') : undefined)

  const startupConfig = {
    reactNative: {
      apiKey: config.apiKey,
      endpoint: endpoint,
      samplingEndpoint: samplingEndpoint,
      autoInstrumentAppStarts: true,
      autoInstrumentNetworkRequests: false,
      maximumBatchSize: 1,
      attach: true,
    },
    native: {
      apiKey: config.apiKey,
      endpoint: endpoint,
      samplingEndpoint: samplingEndpoint,
      autoInstrumentAppStarts: true,
      autoInstrumentViewLoads: true,
    }
  }

  await NativeScenarioLauncher.saveStartupConfig(startupConfig)
  await NativeScenarioLauncher.exitApp()
}

export const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>NativeAppStartScenario</Text>
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