import React, { useEffect } from 'react'
import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { mazeAddress } from '../lib/CommandRunner'

export const config = {
  maximumBatchSize: 1,
  batchInactivityTimeoutMs: 5000,
  autoInstrumentAppStarts: false,
  appVersion: '1.2.3',
  networkRequestCallback: (networkRequestInfo) => {
    // don't send the span for the xhr request
    if (networkRequestInfo.url.indexOf('xhr') > -1) {
      return null
    }

    // modify the url for the fetch request
    return { ...networkRequestInfo, url: networkRequestInfo.url + '&not-your-ordinary-url=true' }
  }
}

const fetchSuccess = async () => {
  try {
    await fetch(`https://${mazeAddress}/?fetch=true`)
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

    xhrSuccess.open('GET', `https://${mazeAddress}/?xhr=true`)
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
        <Text>NetworkRequestCallbackScenario</Text>
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
