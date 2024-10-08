import React, { useEffect } from 'react'
import { SafeAreaView, StyleSheet, Text, View } from 'react-native'

export const initialise = async (config) => {
  config.maximumBatchSize = 1
  config.batchInactivityTimeoutMs = 5000
  config.autoInstrumentNetworkRequests = true
  config.networkRequestCallback = (networkRequestInfo) => {
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
    await fetch(`https://bugsnag.com?fetch=true`)
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

    xhrSuccess.open('GET', `https://bugsnag.com?xhr=true`)
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
