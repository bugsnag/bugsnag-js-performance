import React, { useContext, useEffect } from 'react'
import { SafeAreaView, StyleSheet, View, Text, RootTagContext, unstable_RootTagContext } from 'react-native'
import { launchScenario } from '@bugsnag/react-native-performance-scenarios'

console.reportErrorsAsExceptions = false

const App = () => {
  const rootTag = useContext(RootTagContext || unstable_RootTagContext)

  useEffect(() => {
    launchScenario(rootTag)
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

export default App
