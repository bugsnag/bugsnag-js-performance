import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { NativeScenarioLauncher } from '../../lib/native'
import BugsnagPerformance from '@bugsnag/react-native-performance'

export const doNotStartBugsnagPerformance = true

export const initialise = async (config) => {
  const nativeConfig = {
    apiKey: config.apiKey,
    endpoint: config.endpoint
  }

  const onSpanStart = [
    (span) => {
      span.setAttribute('custom.string.attribute', 'test')
      span.setAttribute('custom.int.attribute', 12345)
    }
  ]

  const onSpanEnd = [
    async (span) => {
      span.setAttribute('custom.double.attribute', 123.45)
      span.setAttribute('custom.boolean.attribute', true)
      span.setAttribute('custom.stringarray.attribute', ['a', 'b', 'c'])
      span.setAttribute('custom.intarray.attribute', [1, 2, 3])
      span.setAttribute('custom.doublearray.attribute', [1.1, 2.2, 3.3])
      return true
    }
  ]

  await NativeScenarioLauncher.startNativePerformance(nativeConfig)

  BugsnagPerformance.attach({ onSpanStart, onSpanEnd, maximumBatchSize: 1, autoInstrumentAppStarts: false, autoInstrumentNetworkRequests: false })
}

export const App = () => {
  useEffect(() => {
    const parentSpan = BugsnagPerformance.startSpan('JS parent span')
    const childSpan = BugsnagPerformance.startSpan('Native child span', { isFirstClass: true })
    childSpan.end()
    parentSpan.end()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>Native Integration Scenario</Text>
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
