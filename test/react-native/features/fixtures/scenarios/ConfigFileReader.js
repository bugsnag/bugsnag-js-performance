import { Dirs, FileSystem } from 'react-native-file-access'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const checkDirectoryExists = async () => {
  const startTime = Date.now()
  let sdCardDirExists = false
  let emulatedDirExists = false

  while (Date.now() - startTime < 60000) {
    const sdCardDir = `${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files/`
    sdCardDirExists = await FileSystem.exists(sdCardDir)
    console.log(`Directory ${sdCardDir} exists: ${sdCardDirExists}`)

    const emulatedDir = '/storage/emulated/0/Android/data/com.bugsnag.fixtures.reactnative.performance/files/'
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
  const configFilePath = `${Dirs.DocumentDir}/fixture_config.json`
  const startTime = Date.now()

  // poll for the config file to exist
  while (Date.now() - startTime < 60000) {
    const emulatedExternalConfigFile = '/storage/emulated/0/Android/data/com.bugsnag.fixtures.reactnative.performance/files/fixture_config.json'
    console.log(`Emulated storage file path: ${emulatedExternalConfigFile}`)

    const emulatedExternalConfigFileExists = await FileSystem.exists(emulatedExternalConfigFile)
    console.log(`Emulated storage file '${emulatedExternalConfigFile}' exists: ${emulatedExternalConfigFileExists}`)

    await delay(10000)
  }

  let configFileExists = false
  try {
    console.log('copying config file into document directory...')
    await FileSystem.cp('/storage/emulated/0/Android/data/com.bugsnag.fixtures.reactnative.performance/files/fixture_config.json', configFilePath)
    configFileExists = await FileSystem.exists(configFilePath)
    console.log(`copied config file into document directory. success: ${configFileExists}`)
  } catch (e) {
    console.log('error copying config file: ', e)
  }

  if (!configFileExists) {
    console.log('config file not fould, setting maze address to bs-local.com:9339')
    return 'bs-local.com:9339'
  }

  console.log('config file exists! Attempting to read file...')
  const configFile = await FileSystem.readFile(configFilePath)
  console.log(`config file raw contents: ${configFile}`)
  const config = JSON.parse(configFile)
  console.log(`config file JSON contents: ${JSON.stringify(config)}`)
  return config.maze_address
}

module.exports.checkDirectoryExists = checkDirectoryExists
module.exports.listDirectoryContents = listDirectoryContents
module.exports.getMazeRunnerAddress = getMazeRunnerAddress
