import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { NativeScenarioLauncher } from '../../lib/native'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import { BugsnagJavascriptSpansPlugin } from '@bugsnag/plugin-react-native-span-access'

export const doNotStartBugsnagPerformance = true

export const initialise = async (config) => {
  const nativeConfig = {
    apiKey: config.apiKey,
    endpoint: config.endpoint
  }

  await NativeScenarioLauncher.startNativePerformance(nativeConfig)

  BugsnagPerformance.attach({
    maximumBatchSize: 1,
    autoInstrumentAppStarts: false,
    autoInstrumentNetworkRequests: false,
    plugins: [new BugsnagJavascriptSpansPlugin()]
  })
}

export const App = () => {
  useEffect(() => {
    (async () => {
      const span = BugsnagPerformance.startSpan('JavascriptSpansPluginScenario')

      const attributes = [
        { name: 'custom.string.attribute', value: 'test' },
        { name: 'custom.int.attribute', value: 12345 },
        { name: 'custom.double.attribute', value: 123.45 },
        { name: 'custom.boolean.attribute', value: true },
        { name: 'custom.stringarray.attribute', value: ['a', 'b', 'c'] },
        { name: 'custom.intarray.attribute', value: [1, 2, 3] },
        { name: 'custom.doublearray.attribute', value: [1.1, 2.2, 3.3] }
      ]

      await NativeScenarioLauncher.updateJavascriptSpan(span.name, attributes)
    })()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>Javascript Spans Plugin Scenario</Text>
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
