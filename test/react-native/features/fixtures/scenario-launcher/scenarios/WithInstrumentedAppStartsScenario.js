import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'

export const withInstrumentedAppStarts = true
export const config = {
  maximumBatchSize: 1,
  autoInstrumentAppStarts: false
}

export const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>WithInstrumentedAppStartsScenario</Text>
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
