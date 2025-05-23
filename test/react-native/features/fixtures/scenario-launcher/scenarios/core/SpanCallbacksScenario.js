import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import BugsnagPerformance from '@bugsnag/react-native-performance'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export const initialise = async (config) => {

  const startCallback1 = (span) => { span.setAttribute('start_callback', 1) }

  const startCallback2 = (span) => {
    if (span.name === 'Span 2') {
      span.setAttribute('start_callback', 2)
    }
  }

  const endCallback1 = (span) => {
    span.setAttribute('end_callback', true)
  }

  const endCallback2 = async (span) => {
    await delay(100)

    return span.name !== 'discard me'
  }


  config.maximumBatchSize = 3
  config.batchInactivityTimeoutMs = 5000
  config.onSpanStart = [startCallback1, startCallback2]
  config.onSpanEnd = [endCallback1, endCallback2]
}

export const App = () => {
  useEffect(() => {
    BugsnagPerformance.startSpan('Span 1').end()
    BugsnagPerformance.startSpan('Span 2').end()
    BugsnagPerformance.startSpan('discard me').end()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>SpanCallbacksScenario</Text>
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
