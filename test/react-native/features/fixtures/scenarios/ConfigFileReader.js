import { Dirs, FileSystem } from 'react-native-file-access'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const checkDirectoryExists = async () => {
  const startTime = Date.now()
  let sdCardDirExists = false
  let emulatedDirExists = false

  while (Date.now() - startTime < 60000) {
    const sdCardDir = `${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files`
    sdCardDirExists = await FileSystem.exists(sdCardDir)
    console.log(`Directory ${sdCardDir} exists: ${sdCardDirExists}`)

    const emulatedDir = '/storage/emulated/0/Android/data/com.bugsnag.fixtures.reactnative.performance/files'
    emulatedDirExists = await FileSystem.exists(emulatedDir)
    console.log(`Directory ${emulatedDir} exists: ${emulatedDirExists}`)

    await delay(10000)
  }

  return sdCardDirExists || emulatedDirExists
}

const listDirectoryContents = async () => {
  const startTime = Date.now()
  let sdCardDirContents = []
  let emulatedDirContents = []
  while (Date.now() - startTime < 60000) {
    const sdCardDir = `${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files/`
    sdCardDirContents = await FileSystem.ls(sdCardDir)
    console.log(`Directory '${sdCardDir}' contents: ${sdCardDirContents}`)

    const emulatedDir = '/storage/emulated/0/Android/data/com.bugsnag.fixtures.reactnative.performance/files/'
    emulatedDirContents = await FileSystem.ls(emulatedDir)
    console.log(`Directory '${emulatedDir}' contents: ${emulatedDirContents}`)

    await delay(10000)
  }

  return sdCardDirContents.length > 0 ? JSON.stringify(sdCardDirContents) : JSON.stringify(emulatedDirContents)
}

const getMazeRunnerAddress = async () => {
  const startTime = Date.now()

  // poll for the config file to exist
  while (Date.now() - startTime < 60000) {
    const externalConfigFile = `${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files/fixture_config.json`
    const externalConfigFileExists = await FileSystem.exists(externalConfigFile)
    console.log(`File ${externalConfigFile} exists: ${externalConfigFileExists}`)

    if (externalConfigFileExists) {
      const configFile = await FileSystem.readFile(externalConfigFile)
      console.log(`config file raw contents: ${configFile}`)
      const config = JSON.parse(configFile)
      console.log(`config file JSON contents: ${JSON.stringify(config)}`)
      return config.maze_address
    }

    const emulatedExternalConfigFile = '/storage/emulated/0/Android/data/com.bugsnag.fixtures.reactnative.performance/files/fixture_config.json'
    const emulatedExternalConfigFileExists = await FileSystem.exists(emulatedExternalConfigFile)
    console.log(`Emulated storage file '${emulatedExternalConfigFile}' exists: ${emulatedExternalConfigFileExists}`)

    if (emulatedExternalConfigFileExists) {
      const configFile = await FileSystem.readFile(emulatedExternalConfigFile)
      console.log(`config file raw contents: ${configFile}`)
      const config = JSON.parse(configFile)
      console.log(`config file JSON contents: ${JSON.stringify(config)}`)
      return config.maze_address
    }

    await delay(10000)
  }
}

module.exports.checkDirectoryExists = checkDirectoryExists
module.exports.listDirectoryContents = listDirectoryContents
module.exports.getMazeRunnerAddress = getMazeRunnerAddress
