import React from 'react'
import { SafeAreaView, View, Text, StyleSheet, Platform, StatusBar } from 'react-native'
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

// On Android, SafeAreaView is a plain View and applies no insets. Apps that
// target SDK 35 or newer (React Native 0.78+) are drawn edge-to-edge on
// Android 15, so without this the 'wrapper-component' text is laid out
// entirely underneath the status bar. Android reports views that are fully
// covered by another window as not visible to accessibility services, so
// Appium cannot find the element and app-start-spans.feature fails.
const androidStatusBarInset = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 0

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: androidStatusBarInset
  },
  scenario: {
    flex: 1
  }
})
