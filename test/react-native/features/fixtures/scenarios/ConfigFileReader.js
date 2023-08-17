import { FileSystem } from 'react-native-file-access'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const getMazeRunnerAddress = async () => {
  const startTime = Date.now()

  // poll for the config file to exist
  while (Date.now() - startTime < 120000) {
    const tempDir = '/data/local/tmp'
    const tempDirExists = await FileSystem.exists(tempDir)
    console.log(`${tempDir} exists?: ${tempDirExists}`)

    const configFilePath = `${tempDir}/fixture_config.json`
    const configFileExists = await FileSystem.exists(configFilePath)
    console.log(`${configFilePath} exists?: ${configFileExists}`)

    if (configFileExists) {
      const configFile = await FileSystem.readFile(configFilePath)
      console.log(`config file raw contents: ${configFile}`)
      const config = JSON.parse(configFile)
      console.log(`config file JSON contents: ${JSON.stringify(config)}`)
      return `${config.maze_address}`
    }

    await delay(10000)
  }

  return 'bs-local:9339'
}

module.exports.getMazeRunnerAddress = getMazeRunnerAddress
