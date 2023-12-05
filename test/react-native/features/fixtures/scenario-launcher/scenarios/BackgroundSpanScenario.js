import BugsnagPerformance from '@bugsnag/react-native-performance'
import React, { useEffect } from 'react'
import { AppState, Text, View } from 'react-native'

export const config = {
  maximumBatchSize: 1,
  autoInstrumentAppStarts: false,
  appVersion: '1.2.3'
}

export const App = () => {
  useEffect(() => {
    const handler = (state) => {
      if (state === 'background') {
        BugsnagPerformance.startSpan('BackgroundSpan').end()
      }
    }

    AppState.addEventListener('change', handler)

    return () => { AppState.removeEventListener('change', handler) }
  }, [])

  return (
    <View>
        <Text>BackgroundSpanScenario</Text>
    </View>
  )
}
