import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import { NativeScenarioLauncher } from '../../lib/native'

export const initialise = async (config) => {
  try {
    if (typeof BugsnagPerformance.endAppStartSpan === 'function') {
      BugsnagPerformance.endAppStartSpan()
    }
  } catch (e) {
    // Ignore if not started
  }

  const endpoint = config.endpoint
  const samplingEndpoint = config.samplingEndpoint ||
    config.sampling_endpoint ||
    (endpoint ? endpoint.replace(/\/traces\/?$/, '/sampling') : undefined)

  const startupConfig = {
    reactNative: {
      apiKey: config.apiKey,
      endpoint: endpoint,
      samplingEndpoint: samplingEndpoint,
      autoInstrumentAppStarts: false,
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
  useEffect(() => {
    // Explicitly start and end the manual app start span so endTimeUnixNano is always valid
    const span = BugsnagPerformance.startAppStartSpan({
      name: 'ReactNativeInit',
      type: 'ReactNativeInit'
    })
    span.end()
  }, [])

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