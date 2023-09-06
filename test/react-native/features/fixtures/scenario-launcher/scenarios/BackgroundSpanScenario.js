import BugsnagPerformance from '@bugsnag/react-native-performance'
import React from 'react'
import { AppState, Text, View } from 'react-native'

export const config = {
  maximumBatchSize: 1,
  autoInstrumentAppStarts: false,
  appVersion: '1.2.3'
}

AppState.addEventListener('change', (state) => {
    if (state === 'background') {
        BugsnagPerformance.startSpan('BackgroundSpan').end()
    }
})

export const App = () => {
  return (
    <View>
        <Text>BackgroundSpanScenario</Text>
    </View>
  )
}
