import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { NativeScenarioLauncher } from '../lib/native'

export const initialise = async (config) => {
  config.autoInstrumentAppStarts = true
  config.maximumBatchSize = 1

  NativeScenarioLauncher.saveStartupConfig(config)
  // NativeScenarioLauncher.exitApp()
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
