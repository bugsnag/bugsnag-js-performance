import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'

export const config = {
  maximumBatchSize: 1,
  batchInactivityTimeoutMs: 5000,
  autoInstrumentAppStarts: false,
  appVersion: '1.2.3'
}

const fetchError = async () => {
  try {
    await fetch('http://localhost:65536')
  } catch (e) {
    console.error('[BugsnagPerformance] error sending fetch request', e)
  }
}

const xhrError = () => {
  return new Promise((resolve, reject) => {
    const xhrError = new XMLHttpRequest()
    xhrError.onerror = () => {
      console.error('[BugsnagPerformance] error sending xhr request', xhr)
      reject()
    }

    xhrError.open('GET', 'http://localhost:65536')
    xhrError.send()
  })
}

export const App = () => {
  useEffect(() => {
    fetchError()
    xhrError()
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
