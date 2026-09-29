import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { NativeScenarioLauncher } from '../../lib/native'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const initialise = async (config) => {
  // this must keep the `reactNative` / `native` shape: on relaunch,
  // launchFromStartupConfig reads `readStartupConfig()?.reactNative` and does
  // nothing at all if that key is missing, so a flattened config means Bugsnag
  // is never started and no requests are ever sent
  const startupConfig = {
    reactNative: {
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      autoInstrumentAppStarts: true,
      autoInstrumentNetworkRequests: false,
      maximumBatchSize: 1,
      batchInactivityTimeoutMs: 1000,
      attach: true
    },
    native: {
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      autoInstrumentAppStarts: true,
      autoInstrumentViewLoads: true
    }
  }

  await NativeScenarioLauncher.saveStartupConfig(startupConfig)
  await delay(250) // allow the config to be flushed to disk before terminating
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
