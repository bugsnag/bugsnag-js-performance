import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import BugsnagPerformance from '@bugsnag/react-native-performance'

export const PersistSamplingValueScenario = (endpoint, apiKey) => {
  const App = () => {
    useEffect(() => {
      BugsnagPerformance.start({ apiKey, endpoint })
    }, [])

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scenario}>
          <Text accessibilityLabel='scenario'>PersistSamplingValueScenario</Text>
          <Text>{endpoint}</Text>
          <Text>{apiKey}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return App
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scenario: {
    flex: 1
  }
})
