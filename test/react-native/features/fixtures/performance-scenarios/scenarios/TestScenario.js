import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'

export const TestScenario = (endpoint) => {
  return () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.scenario}>
        <Text accessibilityLabel='scenario'>TestScenario</Text>
        <Text>{endpoint}</Text>
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
