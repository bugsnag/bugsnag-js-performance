import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { NativeScenarioLauncher } from '../../lib/native'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import { RemoteParentContext } from '@bugsnag/core-performance'

export const doNotStartBugsnagPerformance = true

export const initialise = async (config) => {
  const nativeConfig = {
    apiKey: config.apiKey,
    endpoint: config.endpoint
  }

  await NativeScenarioLauncher.startNativePerformance(nativeConfig)

  BugsnagPerformance.attach({ maximumBatchSize: 1, autoInstrumentAppStarts: false, autoInstrumentNetworkRequests: false })
}

export const App = () => {

    useEffect(() => {
    (async () => {
      const parentSpan = BugsnagPerformance.startSpan('JS parent span')
      const traceParentString = RemoteParentContext.toTraceParentString(parentSpan)
      await NativeScenarioLauncher.sendNativeChildSpan(traceParentString)
      parentSpan.end()
    })()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>Remote Parent Context (JS) Scenario</Text>
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
