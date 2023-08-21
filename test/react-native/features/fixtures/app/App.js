import React, { useContext } from 'react'
import { SafeAreaView, StyleSheet, View, Text, RootTagContext } from 'react-native'
import { launchScenario } from '@bugsnag/react-native-performance-scenarios'

const App = () => {
  const rootTag = useContext(RootTagContext)
  launchScenario(rootTag)
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
