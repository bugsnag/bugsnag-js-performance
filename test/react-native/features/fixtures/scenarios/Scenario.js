import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { readCommand } from './CommandRunner'

export const Scenario = () => {
  const [scenario, setScenario] = useState('Waiting for maze runner command...')
  const [endpoint, setEndpoint] = useState('Waiting for trace endpoint...')

  useEffect(() => {
    const getScenario = async () => {
      const command = await readCommand()
      setScenario(command.scenario_name)
      setEndpoint(command.endpoint)
    }

    getScenario()
  }, [])

  return (
    <View style={styles.scenario}>
      <Text accessibilityLabel='scenario'>{scenario}</Text>
      <Text>{endpoint}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  scenario: {
    flex: 1
  }
})
