import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const config = {
  maximumBatchSize: 1,
  autoInstrumentAppStarts: false,
  appVersion: '1.2.3'
}

export const App = () => {
  const [id, setId] = useState('')
  const [samplingProbability, setSamplingProbability] = useState('')

  useEffect(() => {
    BugsnagPerformance.startSpan('ManualSpanScenario').end()
  }, [])

  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem('bugsnag-anonymous-id')
      console.log(`[BugsnagPerformance] bugsnag-anonymous-id: ${id}`)
      setId(id)
      
      const samplingProbability = await AsyncStorage.getItem('bugsnag-sampling-probability')
      console.log(`[BugsnagPerformance] bugsnag-sampling-probability: ${samplingProbability}`)
      setSamplingProbability(samplingProbability)
    })()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>ManualSpanScenario</Text>
        <Text>Persisted Anonymous ID: {id}</Text>
        <Text>Persisted Sampling Probability: {samplingProbability}</Text>
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
