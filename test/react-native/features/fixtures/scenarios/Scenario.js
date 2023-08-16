import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { getMazeRunnerAddress } from './ConfigFileReader'

export const Scenario = () => {
  const [mazeAddress, setMazeAddress] = useState('Waiting for maze address...')

  useEffect(() => {
    const getMazeAddress = async () => {
      const mazeAddress = await getMazeRunnerAddress()
      setMazeAddress(mazeAddress)
    }
    getMazeAddress()
  })

  return (
    <View style={styles.scenario}>
      <Text accessibilityLabel='scenario'>{mazeAddress}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  scenario: {
    flex: 1
  }
})
