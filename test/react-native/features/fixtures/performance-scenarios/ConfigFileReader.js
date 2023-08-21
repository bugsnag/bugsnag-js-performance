import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const getMazeRunnerAddress = async () => {
  let configFilePath
  const startTime = Date.now()

  // poll for the config file to exist
  while (Date.now() - startTime < 10000) {
    const configFileDir = Platform.OS === 'android' ? '/data/local/tmp' : Dirs.DocumentDir
    configFilePath = `${configFileDir}/fixture_config.json`
    const configFileExists = await FileSystem.exists(configFilePath)

    if (configFileExists) {
      const configFile = await FileSystem.readFile(configFilePath)
      console.log(`found config file at '${configFilePath}'. contents: ${configFile}`)
      const config = JSON.parse(configFile)
      return `${config.maze_address}`
    }

    await delay(500)
  }

  console.log(`no config file found at ${configFilePath}`)
  return 'bs-local:9339'
}

module.exports.getMazeRunnerAddress = getMazeRunnerAddress
