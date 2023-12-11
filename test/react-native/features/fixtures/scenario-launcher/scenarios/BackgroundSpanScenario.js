import BugsnagPerformance from '@bugsnag/react-native-performance'
import React, { useEffect } from 'react'
import { AppState, Text, View } from 'react-native'

export const config = {
  maximumBatchSize: 3,
  batchInactivityTimeoutMs: 5000,
  autoInstrumentAppStarts: false,
  appVersion: '1.2.3'
}

export const App = () => {
  useEffect(() => {
    let wasInBackground = false
    const openDuringBackground = BugsnagPerformance.startSpan('open during backgrounding')

    const handler = (state) => {
      if (state === 'background') {
        wasInBackground = true
        BugsnagPerformance.startSpan('background span').end()
      } else if (wasInBackground && state === 'active') {
        openDuringBackground.end()
        BugsnagPerformance.startSpan('foreground span').end()
      }
    }

    const subscription = AppState.addEventListener('change', handler)

    return () => { subscription.remove() }
  }, [])

  return (
    <View>
        <Text>BackgroundSpanScenario</Text>
    </View>
  )
}
