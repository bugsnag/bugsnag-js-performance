import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const getMazeRunnerAddress = async () => {
  const configFilePath = Platform.OS === 'android'
    ? `${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files/fixture_config.json`
    : `${Dirs.DocumentDir}/fixture_config.json`

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

module.exports.getMazeRunnerAddress = getMazeRunnerAddress
