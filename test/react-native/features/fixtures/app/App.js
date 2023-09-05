import React, { useContext, useEffect } from 'react'
import { SafeAreaView, StyleSheet, View, Text, RootTagContext } from 'react-native'
import { commandRunner } from '@bugsnag/react-native-performance-scenarios'

console.reportErrorsAsExceptions = false

const App = () => {
  const rootTag = useContext(RootTagContext)

  useEffect(() => {
    commandRunner(rootTag)
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
