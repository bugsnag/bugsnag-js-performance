import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const checkDirectoryExists = async () => {
  const configFileDir = Platform.OS === 'android'
    ? `${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files/`
    : Dirs.DocumentDir

  const startTime = Date.now()
  let directoryExists = false

  while (Date.now() - startTime < 30000) {
    directoryExists = await FileSystem.exists(configFileDir)
    if (directoryExists) {
      break
    }
  }

  return directoryExists
}

const listDirectoryContents = async () => {
  const configFileDir = Platform.OS === 'android'
    ? `${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files/`
    : Dirs.DocumentDir

  const startTime = Date.now()
  let directoryContents = []

  while (Date.now() - startTime < 30000) {
    directoryContents = await FileSystem.ls(configFileDir)
    if (directoryContents.length > 0) {
      break
    }
  }

  return JSON.stringify(directoryContents)
}

const getMazeRunnerAddress = async () => {
  const configFilePath = Platform.OS === 'android'
    ? `${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files/fixture_config.json`
    : `${Dirs.DocumentDir}/fixture_config.json`

  console.log(`fixture config file path: ${configFilePath}`)
  const startTime = Date.now()
  let configFileExists = false

  // poll for the config file to exist
  while (Date.now() - startTime < 30000) {
    configFileExists = await FileSystem.exists(configFilePath)
    if (configFileExists) {
      break
    }
  }

  if (!configFileExists) {
    return 'bs-local.com:9339'
  }

  const configFile = await FileSystem.readFile(configFilePath)
  const config = JSON.parse(configFile)
  return config.maze_address
}

module.exports.checkDirectoryExists = checkDirectoryExists
module.exports.listDirectoryContents = listDirectoryContents
module.exports.getMazeRunnerAddress = getMazeRunnerAddress
