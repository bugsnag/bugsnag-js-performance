import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { mazeAddress } from '../lib/CommandRunner'

export const config = {
  maximumBatchSize: 2,
  autoInstrumentAppStarts: false,
  appVersion: '1.2.3'
}

const fetchSuccess = async () => {
  try {
    await fetch(`https://${mazeAddress}/reflect?fetch=true`)
  } catch (e) {
    console.error('[BugsnagPerformance] error sending fetch request', e)
  }
}

const xhrSuccess = async () => {
  return new Promise((resolve, reject) => {
    const xhrSuccess = new XMLHttpRequest()
   
    xhrSuccess.onload = () => {
      if (xhrSuccess.readyState === 4) {
        resolve() 
      }
    }

    xhrSuccess.onerror = () => {
      console.error('[BugsnagPerformance] error sending xhr request', xhr)
      reject()
    }

    xhrSuccess.open('GET', `https://${mazeAddress}/reflect?xhr=true`)
    xhrSuccess.send()
  })
}

export const App = () => {
  useEffect(() => {
    fetchSuccess()
    xhrSuccess()
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
