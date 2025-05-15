import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import BugsnagPerformance from '@bugsnag/react-native-performance'
import BugsnagPluginReactNavigationPerformance from '@bugsnag/plugin-react-navigation-performance'
import { useNavigationContainerRef, useRouter } from 'expo-router'

export const initialise = async (config) => {
    config.maximumBatchSize = 4
    config.batchInactivityTimeoutMs = 5000
    config.plugins = [new BugsnagPluginReactNavigationPerformance()]
}

export const App = () => {
  const navigationPlugin = BugsnagPerformance.getPlugin(BugsnagPluginReactNavigationPerformance)
  const navigationContainerRef = useNavigationContainerRef()
  const router = useRouter()

  useEffect(() => {
    navigationPlugin.registerNavigationContainerRef(navigationContainerRef)

    setTimeout(() => {
      router.navigate('./two')
    }, 250);

  }, [navigationContainerRef])

  return (
    <View style={styles.scenario}>
      <Text>ExpoRouterScenario</Text>
    </View>
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