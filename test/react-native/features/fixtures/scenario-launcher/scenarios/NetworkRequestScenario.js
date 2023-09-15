import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'

export const config = {
  maximumBatchSize: 2,
  autoInstrumentAppStarts: false,
  appVersion: '1.2.3'
}

const fetchSuccess = async () => {
  try {
    await fetch('https://google.com/?fetch=true')
  } 
  catch (e) {
    console.error('[BugsnagPerformance] error sending fetch request', e)
  }
}

const xhrSuccess = async () => {
  return new Promise((resolve) => {
    const xhrSuccess = new XMLHttpRequest()
   
    xhrSuccess.onload = () => {
      if (xhrSuccess.readyState === 4) {
        resolve() 
      }
    }

    xhrSuccess.onerror = () => {
      console.error('[BugsnagPerformance] error sending xhr request', xhr)
      resolve()
    }

    xhrSuccess.open('GET', 'https://google.com/?xhr=true')
    xhrSuccess.send()
  })
}

export const App = () => {
  useEffect(() => {
    const makeRequests = async () => {
      await fetchSuccess()
      await xhrSuccess()
    }

    makeRequests()
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
