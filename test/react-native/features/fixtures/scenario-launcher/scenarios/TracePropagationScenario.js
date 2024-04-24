import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import React, { useContext, useEffect } from 'react'
import { ScenarioContext } from '../lib/ScenarioContext'

export const config = {
  maximumBatchSize: 5,
  autoInstrumentAppStarts: false,
  tracePropagationUrls: [/^http:\/\/.+:\d{4}\/reflect$/],
  networkRequestCallback: (requestInfo) => {
    if (requestInfo.url.endsWith('/command')) return null
    return requestInfo
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const fetchWithObjectLiteralHeadersInOptions = async (endpoint) => {
  try {
    await fetch(endpoint, { headers: { 'X-Test-Header': 'test' } })
  } catch (e) {
    console.error('[BugsnagPerformance] error sending fetch request', e)
  }
}

const fetchWithHeadersClassInOptions = async (endpoint) => {
  try {
    await fetch(endpoint, { headers: new Headers({ 'X-Test-Header': 'test' }) })
  } catch (e) {
    console.error('[BugsnagPerformance] error sending fetch request', e)
  }
}

const fetchWithObjectLiteralHeadersInRequest = async (endpoint) => {
  try {
    const request = new Request(endpoint, { headers: { 'X-Test-Header': 'test' }})
    await fetch(request)
  } catch (e) {
    console.error('[BugsnagPerformance] error sending fetch request', e)
  }
}

const fetchWithHeadersClassInRequest = async (endpoint) => {
  try {
    const request = new Request(endpoint, { headers: new Headers({ 'X-Test-Header': 'test' }) })
    await fetch(request)
  } catch (e) {
    console.error('[BugsnagPerformance] error sending fetch request', e)
  }
}

const xhrWithHeaders = async (endpoint) => {
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

    xhrSuccess.open('GET', endpoint)
    xhrSuccess.setRequestHeader('X-Test-Header', 'test')
    xhrSuccess.send()
  })
}

export const App = () => {
  const { reflectEndpoint } = useContext(ScenarioContext)

  useEffect(() => {
    (async () => {
        await delay(250)

        await fetchWithObjectLiteralHeadersInOptions(reflectEndpoint)
        await fetchWithHeadersClassInOptions(reflectEndpoint)

        await fetchWithObjectLiteralHeadersInRequest(reflectEndpoint)
        await fetchWithHeadersClassInRequest(reflectEndpoint)

        await xhrWithHeaders(reflectEndpoint)
    })()
}, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>TracePropagationScenario</Text>
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
