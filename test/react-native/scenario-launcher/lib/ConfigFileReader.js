import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const TIMEOUT = 60000
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const getCandidatePaths = () => {
  if (Platform.OS === 'android') {
    return [
      `${Dirs.DocumentDir}/fixture_config.json`,
      `${Dirs.CacheDir}/fixture_config.json`,
      `${Dirs.SDCardDir}/fixture_config.json`,
      '/sdcard/fixture_config.json',
      '/data/local/tmp/fixture_config.json'
    ]
  }

  return [
    `${Dirs.DocumentDir}/fixture_config.json`,
    `${Dirs.CacheDir}/fixture_config.json`
  ]
}

const getMazeRunnerAddress = async () => {
  const candidatePaths = getCandidatePaths()
  const startTime = Date.now()

  // Poll for the config file across all candidate directories
  while (Date.now() - startTime < TIMEOUT) {
    for (const configFilePath of candidatePaths) {
      try {
        const configFileExists = await FileSystem.exists(configFilePath)

        if (configFileExists) {
          const configFile = await FileSystem.readFile(configFilePath)
          console.error(`[BugsnagPerformance] found config file at '${configFilePath}'. contents: ${configFile}`)
          const config = JSON.parse(configFile)
          const address = config.maze_address || config.mazeAddress
          if (address) {
            return `${address}`
          }
        }
      } catch (err) {
        // Silently catch permission errors (e.g., EACCES on /data/local/tmp on Android 13+) and continue checking other paths
      }
    }

    await delay(500)
  }

  console.error(`[BugsnagPerformance] no config file found in candidate paths [${candidatePaths.join(', ')}], falling back to 'localhost:9339'`)
  return 'localhost:9339'
}

module.exports.getMazeRunnerAddress = getMazeRunnerAddress