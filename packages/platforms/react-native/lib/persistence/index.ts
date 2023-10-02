import { File, ReadOnlyFile, NullFile } from './file'
import FileBasedPersistence from './file-based'
import NativeBugsnagPerformance from '../native'
import { Platform } from 'react-native'
import { Dirs, type FileSystem } from 'react-native-file-access'

const PERSISTED_STATE_VERSION = 1
const PERSISTED_STATE_PATH = `${Dirs.CacheDir}/bugsnag-performance-react-native/v${PERSISTED_STATE_VERSION}/persisted-state.json`

export default function persistenceFactory (fileSystem: typeof FileSystem): FileBasedPersistence {
  const nativeDeviceIdFilePath = Platform.select({
    get ios () {
      if (NativeBugsnagPerformance) {
        return `${Dirs.CacheDir}/bugsnag-shared-${NativeBugsnagPerformance.getBundleIdentifier()}/device-id.json`
      }
    },
    android: `${Dirs.DocumentDir}/device-id`,
    default: undefined
  })

  const nativeDeviceIdFile = nativeDeviceIdFilePath
    ? new ReadOnlyFile(nativeDeviceIdFilePath, fileSystem)
    : new NullFile()

  return new FileBasedPersistence(
    new File(PERSISTED_STATE_PATH, fileSystem),
    nativeDeviceIdFile
  )
}
