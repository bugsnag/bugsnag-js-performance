import { AppRegistry, SafeAreaView, StyleSheet, View, Text, RootTagContext, unstable_RootTagContext } from 'react-native'
import React, { useContext, useEffect } from 'react'
import { name as appName } from './app.json';
import BugsnagPerformance from '@bugsnag/react-native-performance';
import { launchScenario, NativeScenarioLauncher } from '@bugsnag/react-native-performance-scenarios'

const startupConfig = NativeScenarioLauncher.readStartupConfig()
if (startupConfig) {
  if (startupConfig.attachToNativeSDK) {
    NativeScenarioLauncher.startNativePerformance(startupConfig)
    BugsnagPerformance.attach(startupConfig)
  } else {
    BugsnagPerformance.start(startupConfig)
  }
}

const App = () => {
  const rootTag = useContext(RootTagContext || unstable_RootTagContext)

  useEffect(() => {
    if (!startupConfig) launchScenario(rootTag)
  }, [rootTag])

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text>React Native Performance Test App</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})

AppRegistry.registerComponent(appName, () => App);