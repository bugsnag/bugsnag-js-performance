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
    fetch('https://google.com/?fetch=true')
    .then(() => {
      // xhr
      const xhr = new XMLHttpRequest()
      xhr.onerror = () => {
        console.error('[BugsnagPerformance] error sending xhr request', xhr)
      }

      xhr.open('GET', 'https://google.com/?xhr=true')
      xhr.send()
    })
    .catch((err) => {
      console.error('[BugsnagPerformance] error sending fetch request', err)
    })
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>NetworkSpanScenario</Text>
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
