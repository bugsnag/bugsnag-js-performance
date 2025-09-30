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
      const span = BugsnagPerformance.startSpan('JavascriptSpansContextScenario')
      await NativeScenarioLauncher.sendNativeSpanWithJsParent(span.name)
      span.end()
    })()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>Javascript Span Context Scenario</Text>
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
