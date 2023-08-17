import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { getMazeRunnerAddress, checkDirectoryExists } from './ConfigFileReader'
import { Dirs } from 'react-native-file-access'

export const Scenario = () => {
  // const [directoryContents, setDirectoryContents] = useState('Waiting for directory...')
  const [mazeAddress, setMazeAddress] = useState('Waiting for maze address...')

  useEffect(() => {
    const checkDirectory = async () => {
      await checkDirectoryExists()
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
    getMazeAddress()
  }, [])

  return (
    <View style={styles.scenario}>
      <Text>SD Card Directory: {Dirs.SDCardDir}</Text>
      <Text accessibilityLabel='scenario'>{mazeAddress}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  scenario: {
    flex: 1
  }
})
