import { Dirs, FileSystem } from 'react-native-file-access'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const checkDirectoryExists = async () => {
  const startTime = Date.now()
  let directoryExists = false

  while (Date.now() - startTime < 30000) {
    directoryExists = await FileSystem.exists(Dirs.DocumentDir)
    console.log(`Directory ${Dirs.DocumentDir} exists: ${directoryExists}`)

    const sdCardDir = `${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files/`
    const sdCardDirExists = await FileSystem.exists(sdCardDir)
    console.log(`Directory ${sdCardDir} exists: ${sdCardDirExists}`)

    const emulatedDir = '/storage/emulated/0/Android/data/com.bugsnag.fixtures.reactnative.performance/files/'
    const emulatedDirExists = await FileSystem.exists(emulatedDir)
    console.log(`Directory ${emulatedDir} exists: ${emulatedDirExists}`)

    const externalFileDir = `file://${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files/`
    const externalFileDirExists = await FileSystem.exists(externalFileDir)
    console.log(`Directory ${externalFileDir} exists: ${externalFileDirExists}`)

    await delay(10000)
  }

  return directoryExists
}

const listDirectoryContents = async () => {
  const startTime = Date.now()
  let directoryContents = []

  while (Date.now() - startTime < 30000) {
    directoryContents = await FileSystem.ls(Dirs.DocumentDir)
    console.log(`Directory '${Dirs.DocumentDir}' contents: ${JSON.stringify(directoryContents)}`)

    const sdCardDir = `${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files/`
    const sdCardDirContents = await FileSystem.ls(sdCardDir)
    console.log(`Directory '${sdCardDir}' contents: ${sdCardDirContents}`)

    const emulatedDir = '/storage/emulated/0/Android/data/com.bugsnag.fixtures.reactnative.performance/files/'
    const emulatedDirContents = await FileSystem.ls(emulatedDir)
    console.log(`Directory '${emulatedDir}' contents: ${emulatedDirContents}`)

    const externalFileDir = `file://${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files/`
    const externalFileDirContents = await FileSystem.ls(externalFileDir)
    console.log(`Directory '${externalFileDir}' contents: ${externalFileDirContents}`)

    await delay(10000)
  }

  return JSON.stringify(directoryContents)
}

const getMazeRunnerAddress = async () => {
  const configFilePath = `${Dirs.DocumentDir}/fixture_config.json`
  const startTime = Date.now()
  let configFileExists = false

  // poll for the config file to exist
  while (Date.now() - startTime < 30000) {
    configFileExists = await FileSystem.exists(configFilePath)
    console.log(`File ${configFilePath} exists: ${configFileExists}`)

    const externalConfigFile = `file://${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files/fixture_config.json`
    const externalConfigFileExists = await FileSystem.exists(externalConfigFile)
    console.log(`File ${externalConfigFile} exists: ${externalConfigFileExists}`)

    const emulatedExternalConfigFile = '/storage/emulated/0/Android/data/com.bugsnag.fixtures.reactnative.performance/files/fixture_config.json'
    const emulatedExternalConfigFileExists = await FileSystem.exists(emulatedExternalConfigFile)
    console.log(`File ${emulatedExternalConfigFile} exists: ${emulatedExternalConfigFileExists}`)

    await delay(10000)
  }

  try {
    await FileSystem.cp('/storage/emulated/0/Android/data/com.bugsnag.fixtures.reactnative.performance/files/fixture_config.json', configFilePath)
  } catch (e) {
    console.log('error copying config file: ', e)
  }

  try {
    await FileSystem.cp(`file://${Dirs.SDCardDir}/Android/data/com.bugsnag.fixtures.reactnative.performance/files/fixture_config.json`, configFilePath)
  } catch (e) {
    console.log('error copying config file: ', e)
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
