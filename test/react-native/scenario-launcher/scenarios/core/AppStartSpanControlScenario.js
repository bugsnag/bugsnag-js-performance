import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import BugsnagPerformance, { AppStartSpanQuery } from '@bugsnag/react-native-performance'

export const initialise = async (config) => {}

export const App = () => {
  useEffect(() => {
    const appStartControl = BugsnagPerformance.getSpanControls(AppStartSpanQuery)
    appStartControl?.setType('AppStartSpanControlScenario')
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>AppStartSpanControlScenario</Text>
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
