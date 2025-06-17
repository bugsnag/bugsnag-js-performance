import React, { useEffect } from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import { NamedSpanQuery, BugsnagNamedSpansPlugin } from '@bugsnag/plugin-named-spans'

export const initialise = async (config) => {
  config.maximumBatchSize = 1
  config.plugins = [new BugsnagNamedSpansPlugin()]
}

export const App = () => {
  useEffect(() => {
    BugsnagPerformance.startSpan('NamedSpansPluginScenario')
    const spanControls = BugsnagPerformance.getSpanControls(new NamedSpanQuery('NamedSpansPluginScenario'))
    spanControls.setAttribute('custom_attribute', true)
    spanControls.end()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text>NamedSpansPluginScenario</Text>
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
