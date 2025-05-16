import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'

export const withInstrumentedAppStarts = true

export const initialise = async (config) => {
  config.maximumBatchSize = 1
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
