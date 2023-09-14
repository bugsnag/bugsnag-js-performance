import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'

export const config = {
  maximumBatchSize: 2,
  autoInstrumentAppStarts: false,
  appVersion: '1.2.3'
}

export const App = () => {
  useEffect(() => {
    // fetch
    fetch('http://localhost:65536')
    .catch((err) => {
      console.error('[BugsnagPerformance] error sending fetch request', err)

      // xhr
      const xhr = new XMLHttpRequest()
      xhr.onerror = () => {
        console.error('[BugsnagPerformance] error sending xhr request', xhr)
      }

      xhr.open('GET', 'http://localhost:65536')
      xhr.send()
    })
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>NetworkRequestFailedScenario</Text>
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
