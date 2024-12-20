import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { NativeScenarioLauncher } from '../lib/native'
import BugsnagPerformance from '@bugsnag/react-native-performance'

export const doNotStartBugsnagPerformance = true

export const initialise = async (config) => {
  const nativeConfig = {
    apiKey: config.apiKey,
    endpoint: config.endpoint
  }

  const onSpanEnd = [
    async (span) => {
      if (span.name === 'JS parent span') {
        span.setAttribute('custom.js.attribute', 'JS span attribute')
      } else if (span.name === 'Native child span') {
        span.setAttribute('custom.native.attribute', 'Native span attribute')
      }
      return true
    }
  ]

  await NativeScenarioLauncher.startNativePerformance(nativeConfig)

  BugsnagPerformance.attach({ onSpanEnd, maximumBatchSize: 1, autoInstrumentAppStarts: false, autoInstrumentNetworkRequests: false })
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
