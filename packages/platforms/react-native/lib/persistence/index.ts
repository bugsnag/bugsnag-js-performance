import { Platform } from 'react-native'
import type { DeviceInfo } from '../NativeBugsnagPerformance'
import { File, NullFile, ReadOnlyFile } from './file'
import { Dirs } from './file-native'
import type { FileSystem } from './file-native'
import FileBasedPersistence from './file-based'

export { Util } from './file-utils'

const PERSISTENCE_VERSION = 1
export const PERSISTENCE_DIRECTORY = `${Dirs.CacheDir}/bugsnag-performance-react-native/v${PERSISTENCE_VERSION}`

const PERSISTED_STATE_PATH = `${PERSISTENCE_DIRECTORY}/persisted-state.json`

export default function persistenceFactory (fileSystem: typeof FileSystem, deviceInfo?: DeviceInfo): FileBasedPersistence {
  const nativeDeviceIdFilePath = Platform.select({
    get ios () {
      if (deviceInfo && deviceInfo.bundleIdentifier) {
        return `${Dirs.CacheDir}/bugsnag-shared-${deviceInfo.bundleIdentifier}/device-id.json`
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
