import { Dirs, FileSystem } from 'react-native-file-access'
import { delay } from './utils'

const TIMEOUT = 60000

const getMazeRunnerAddress = async () => {
  const startTime = Date.now()
  const configFileDirectories = ['/data/local/tmp', Dirs.DocumentDir]

  console.log(`[BugsnagPerformance] looking for config files at ${configFileDirectories.join(', ')}`)
  
  // poll for the config file to exist
  while (Date.now() - startTime < TIMEOUT) {
    const fileExistsArray = await Promise.all(configFileDirectories.map(async (dir) => [dir, await FileSystem.exists(dir + '/fixture_config.json')]))
    const [dir] = fileExistsArray.find(([dir, exists]) => exists) || [null]
    
    if (dir) {
      const configFile = await FileSystem.readFile(`${dir}/fixture_config.json`)
      console.error(`[BugsnagPerformance] found config file at '${dir}'. contents: ${configFile}`)
      const config = JSON.parse(configFile)
      return `${config.maze_address}`
    }

    await delay(500)
  }

  console.error(`[BugsnagPerformance] no config file found, falling back to 'localhost:9339'`)
  return 'localhost:9339'
}

module.exports.getMazeRunnerAddress = getMazeRunnerAddress
