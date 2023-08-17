import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const getMazeRunnerAddress = async () => {
  const startTime = Date.now()

  // poll for the config file to exist
  while (Date.now() - startTime < 60000) {
    const configFileDir = Platform.OS === 'android' ? '/data/local/tmp' : Dirs.DocumentDir
    const tempDirExists = await FileSystem.exists(configFileDir)
    console.log(`${configFileDir} exists?: ${tempDirExists}`)

    const configFilePath = `${configFileDir}/fixture_config.json`
    const configFileExists = await FileSystem.exists(configFilePath)
    console.log(`${configFilePath} exists?: ${configFileExists}`)

    if (configFileExists) {
      const configFile = await FileSystem.readFile(configFilePath)
      console.log(`config file raw contents: ${configFile}`)
      const config = JSON.parse(configFile)
      console.log(`config file JSON contents: ${JSON.stringify(config)}`)
      return `${config.maze_address}`
    }

    await delay(5000)
  }

  return 'bs-local:9339'
}

module.exports.getMazeRunnerAddress = getMazeRunnerAddress
