import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import BugsnagPerformance from '@bugsnag/react-native-performance'

export const config = {
  maximumBatchSize: 1,
  autoInstrumentAppStarts: false
}

export const App = BugsnagPerformance.withInstrumentedAppStarts(() => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>AppStartScenario</Text>
      </View>
    </SafeAreaView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scenario: {
    flex: 1
  }
})
