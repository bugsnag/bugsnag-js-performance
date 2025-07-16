import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { NativeScenarioLauncher } from '../../lib/native'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import { NativeSpanQuery, BugsnagNativeSpansPlugin } from '@bugsnag/plugin-react-native-span-access'

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
    plugins: [new BugsnagNativeSpansPlugin()]
  })
}

export const App = () => {
  useEffect(() => {
    (async () => {
      await NativeScenarioLauncher.startNativeSpan({ name: 'NativeSpansPluginScenarioParent' })
      const nativeSpanControl = BugsnagPerformance.getSpanControls(new NativeSpanQuery('NativeSpansPluginScenarioParent'))

      const childSpan = BugsnagPerformance.startSpan('NativeSpansPluginScenarioChild', { isFirstClass: false, parentContext: nativeSpanControl })
      childSpan.end()

      await nativeSpanControl.updateSpan(span => {
        span.setAttribute('custom.string.attribute', 'test')
        span.setAttribute('custom.int.attribute', 12345)
        span.setAttribute('custom.double.attribute', 123.45)
        span.setAttribute('custom.boolean.attribute', true)
        span.setAttribute('custom.stringarray.attribute', ['a', 'b', 'c'])
        span.setAttribute('custom.intarray.attribute', [1, 2, 3])
        span.setAttribute('custom.doublearray.attribute', [1.1, 2.2, 3.3])
        span.end()
      })
    })()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>Native Spans Plugin Scenario</Text>
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
