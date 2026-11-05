import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

// Keep this below Maze Runner's receive_requests_wait (30s by default) so
// that, when the config file can't be read, the fallback below is logged
// while the scenario is still running. At 60s the step timed out first and
// the log never appeared, which made this failure mode silent.
const TIMEOUT = 20000
const CONFIG_FILE_NAME = 'fixture_config.json'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Directories Maze Runner may have pushed the fixture config into, in the order
 * we should trust them.
 *
 * On Android, Maze Runner writes to the app's own external files directory
 * (/sdcard/Android/data/<app id>/files) unless the test suite overrides
 * Maze.config.android_app_files_directory. That default is readable by the app
 * on every Android version, whereas /data/local/tmp is labelled shell_data_file
 * and is unreadable to an untrusted_app process on recent releases - so the
 * legacy location is only kept as a fallback.
 */
const getConfigFileDirectories = () => {
  if (Platform.OS !== 'android') {
    return [Dirs.DocumentDir]
  }

  // MainBundleDir is applicationInfo.dataDir, e.g. '/data/user/0/com.example'
  const packageName = (Dirs.MainBundleDir || '').split('/').filter(Boolean).pop()

  const directories = []

  if (packageName) {
    directories.push(`/sdcard/Android/data/${packageName}/files`)

    // some devices report external storage somewhere other than /sdcard
    if (Dirs.SDCardDir && Dirs.SDCardDir !== '/sdcard') {
      directories.push(`${Dirs.SDCardDir}/Android/data/${packageName}/files`)
    }
  }

  // kept for compatibility with suites that still set
  // Maze.config.android_app_files_directory = '/data/local/tmp'
  directories.push('/data/local/tmp')

  return directories
}

const findConfigFile = async directories => {
  for (const directory of directories) {
    const path = `${directory}/${CONFIG_FILE_NAME}`

    try {
      if (await FileSystem.exists(path)) {
        return path
      }
    } catch (e) {
      // the directory may not be readable by this process - try the next one
    }
  }

  return null
}

const getMazeRunnerAddress = async () => {
  const directories = getConfigFileDirectories()
  const startTime = Date.now()

  // poll for the config file to exist
  while (Date.now() - startTime < TIMEOUT) {
    const configFilePath = await findConfigFile(directories)

    if (configFilePath) {
      const configFile = await FileSystem.readFile(configFilePath)
      console.error(`[BugsnagPerformance] found config file at '${configFilePath}'. contents: ${configFile}`)
      const config = JSON.parse(configFile)
      return `${config.maze_address}`
    }

    await delay(500)
  }

  console.error(`[BugsnagPerformance] no config file found in any of ${directories.join(', ')}, falling back to 'localhost:9339'`)
  return 'localhost:9339'
}

module.exports.getMazeRunnerAddress = getMazeRunnerAddress
