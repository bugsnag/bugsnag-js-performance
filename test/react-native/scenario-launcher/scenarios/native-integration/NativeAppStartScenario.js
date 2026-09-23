import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import { NativeScenarioLauncher } from '../../lib/native'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const initialise = async (config) => {
  // 1. End in-flight app start span before exiting
  try {
    if (typeof BugsnagPerformance.endAppStartSpan === 'function') {
      BugsnagPerformance.endAppStartSpan()
    }
  } catch (e) {
    // Ignore if not started
  }

  // 2. Derive the sampling endpoint
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

  // 3. Save config and allow I/O buffer to flush before killing process
  await NativeScenarioLauncher.saveStartupConfig(startupConfig)
  await delay(250)
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