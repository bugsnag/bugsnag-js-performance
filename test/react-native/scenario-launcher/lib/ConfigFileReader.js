import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const TIMEOUT = 15000 // Reduced to 15s to stay well under Cucumber's 30s limit
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const getCandidateSearchPaths = () => {
  const configNames = ['fixture_config.json', 'maze_runner_address.txt', 'maze_address.txt']
  const dirs = []

  if (Platform.OS === 'android') {
    if (Dirs.DocumentDir) dirs.push(Dirs.DocumentDir)
    if (Dirs.CacheDir) dirs.push(Dirs.CacheDir)
    if (Dirs.SDCardDir) dirs.push(Dirs.SDCardDir)
    dirs.push('/sdcard')
    dirs.push('/data/local/tmp')
  } else {
    if (Dirs.DocumentDir) dirs.push(Dirs.DocumentDir)
    if (Dirs.CacheDir) dirs.push(Dirs.CacheDir)
  }

  const searchPaths = []
  for (const dir of dirs) {
    for (const name of configNames) {
      searchPaths.push(`${dir}/${name}`)
    }
  }
  return searchPaths
}

const parseMazeAddress = (content) => {
  if (!content) return null
  const trimmed = content.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      return parsed.maze_address || parsed.mazeRunnerAddress || parsed.address || null
    } catch (e) {}
  }
  return trimmed
}

export const getMazeRunnerAddress = async () => {
  const startTime = Date.now()
  const candidatePaths = getCandidateSearchPaths()

  while (Date.now() - startTime < TIMEOUT) {
    for (const filePath of candidatePaths) {
      try {
        const exists = await FileSystem.exists(filePath)
        if (exists) {
          const fileContent = await FileSystem.readFile(filePath)
          const address = parseMazeAddress(fileContent)
          if (address) {
            console.error(`[BugsnagPerformance] found config file at '${filePath}'. address: ${address}`)
            return address
          }
        }
      } catch (err) {
        // Ignore permission errors on individual paths and continue trying others
      }
    }
    await delay(500)
  }

  console.error("[BugsnagPerformance] no config file found within timeout, falling back to 'localhost:9339'")
  return 'localhost:9339'
}

module.exports.getMazeRunnerAddress = getMazeRunnerAddress
export default getMazeRunnerAddress