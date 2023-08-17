import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { getMazeRunnerAddress, checkDirectoryExists } from './ConfigFileReader'
import { Dirs } from 'react-native-file-access'

export const Scenario = () => {
  const [directoryExists, setDirectoryExists] = useState('Waiting for directory...')
  // const [directoryContents, setDirectoryContents] = useState('Waiting for directory...')
  const [mazeAddress, setMazeAddress] = useState('Waiting for maze address...')

  useEffect(() => {
    const checkDirectory = async () => {
      const exists = await checkDirectoryExists()
      setDirectoryExists(`${exists}`)
    }

    // const lsDirectory = async () => {
    //   const contents = await listDirectoryContents()
    //   setDirectoryContents(contents)
    // }

    const getMazeAddress = async () => {
      const mazeAddress = await getMazeRunnerAddress()
      setMazeAddress(mazeAddress)
    }

    checkDirectory()
    // lsDirectory()
    getMazeAddress()
  }, [])

  return (
    <View style={styles.scenario}>
      <Text>SD Card Directory: {Dirs.SDCardDir}</Text>
      <Text>Directory exists: {directoryExists}</Text>
      <Text accessibilityLabel='scenario'>{mazeAddress}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  scenario: {
    flex: 1
  }
})
