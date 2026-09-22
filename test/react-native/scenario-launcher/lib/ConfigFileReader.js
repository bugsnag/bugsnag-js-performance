import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const TIMEOUT = 10000 // 10 seconds polling max
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Candidate directories and filenames to check for Maze Runner configuration.
 * Covers scoped storage permissions on Android 13+ as well as standard iOS directories.
 */
const getCandidateSearchPaths = () => {
  const configNames = ['fixture_config.json', 'maze_runner_address.txt', 'maze_address.txt']
  const dirs = []

  if (Platform.OS === 'android') {
    // Check app-internal storage first (safe from SELinux / scoped storage restrictions)
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

/**
 * Parses Maze Runner address from file contents (JSON or plain text)
 */
const parseMazeAddress = (content) => {
  if (!content) return null
  const trimmed = content.trim()
  if (!trimmed) return null

  // Check if content is JSON
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      return parsed.maze_address || parsed.mazeRunnerAddress || parsed.address || null
    } catch (e) {
      // Fall through to plain text if JSON parsing fails
    }
  }

  // Treat as plain text address (e.g. 54.193.144.97:9006 or localhost:9339)
  return trimmed
}

/**
 * Polls for Maze Runner configuration across candidate file locations
 */
const getMazeRunnerAddress = async () => {
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
        // Ignore individual directory permission errors (e.g., EACCES on /data/local/tmp on Android 13+)
        // and continue trying alternative candidate paths
      }
    }

    await delay(500)
  }

  console.error("[BugsnagPerformance] no config file found within timeout, falling back to 'localhost:9339'")
  return 'localhost:9339'
}

module.exports.getMazeRunnerAddress = getMazeRunnerAddress
export default getMazeRunnerAddress