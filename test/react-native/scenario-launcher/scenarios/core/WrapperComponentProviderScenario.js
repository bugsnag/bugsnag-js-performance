import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { NativeScenarioLauncher } from '../../lib/native'

export const wrapperComponentProvider = () =>  ({ children }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text accessibilityLabel='wrapper-component' testID='wrapper-component'>WrapperComponentProviderScenario</Text>
        {children}
      </View>
    </SafeAreaView>
  )
}

export const initialise = async (config) => {
  const startupConfig = {
    reactNative: {
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      autoInstrumentAppStarts: true,
      autoInstrumentNetworkRequests: false,
      maximumBatchSize: 1,
      useWrapperComponentProvider: true,
    }
  }

  NativeScenarioLauncher.saveStartupConfig(startupConfig)
  NativeScenarioLauncher.exitApp()
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scenario: {
    flex: 1
  }
})
