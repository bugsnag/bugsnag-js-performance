import File from './file'
import FileBasedPersistence from './file-based'
import { Dirs, type FileSystem } from 'react-native-file-access'

const PERSISTED_STATE_VERSION = 1
const PERSISTED_STATE_PATH = `${Dirs.CacheDir}/bugsnag-performance-react-native/v${PERSISTED_STATE_VERSION}/persisted-state.json`

export default function persistenceFactory (fileSystem: typeof FileSystem): FileBasedPersistence {
  return new FileBasedPersistence(
    new File(PERSISTED_STATE_PATH, fileSystem)
  )
}
