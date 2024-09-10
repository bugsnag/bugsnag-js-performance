import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'

const wrapperComponentProvider = () =>  ({ children }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text accessibilityLabel='wrapper-component' testID='wrapper-component'>WrapperComponentProviderScenario</Text>
        {children}
      </View>
    </SafeAreaView>
  )
}

export const initialise = async (config) => {
  config.maximumBatchSize = 1
  config.wrapperComponentProvider = wrapperComponentProvider
  config.autoInstrumentAppStarts = true
}

export const App = () => {
  return (<Text accessibilityLabel='app-component' testID='app-component'>Wrapped App Component</Text>)
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scenario: {
    flex: 1
  }
})
