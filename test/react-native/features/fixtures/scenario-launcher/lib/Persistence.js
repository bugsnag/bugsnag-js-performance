import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const PERSISTED_STATE_VERSION = 1
const PERSISTED_STATE_DIRECTORY = `${Dirs.CacheDir}/bugsnag-performance-react-native/v${PERSISTED_STATE_VERSION}`
const PERSISTED_STATE_PATH = `${PERSISTED_STATE_DIRECTORY}/persisted-state.json`
const RETRY_QUEUE_DIRECTORY = `${PERSISTED_STATE_DIRECTORY}/retry-queue`

function getNativeDeviceIdFilePath () {
    const nativeDeviceIdFilePath = Platform.select({
        ios: undefined,
        android: `${Dirs.DocumentDir}/device-id`,
        default: undefined
      })

    return nativeDeviceIdFilePath
}

async function writePersistedStateFile(contents) {
    if (!await FileSystem.exists(PERSISTED_STATE_DIRECTORY)) {
        console.error(`[BugsnagPerformance] creating persisted state directory: ${PERSISTED_STATE_DIRECTORY}`)
        await FileSystem.mkdir(PERSISTED_STATE_DIRECTORY)
    }

    console.error(`[BugsnagPerformance] writing to: ${PERSISTED_STATE_PATH}`)

    await FileSystem.writeFile(
        PERSISTED_STATE_PATH,
        JSON.stringify(contents)
    )

    console.error(`[BugsnagPerformance] finished writing to: ${PERSISTED_STATE_PATH}`)
}

export async function setSamplingProbability(value, time = Date.now()) {
    await writePersistedStateFile({
        'sampling-probability': { value, time }
    })
}

export async function setDeviceId(deviceId) {
    await writePersistedStateFile({ 'device-id': deviceId })
}

export async function clearPersistedState() {
    if (await FileSystem.exists(PERSISTED_STATE_PATH)) {
        console.error(`[BugsnagPerformance] Clearing persisted data at path: ${PERSISTED_STATE_PATH}`)
        await FileSystem.unlink(PERSISTED_STATE_PATH)
    }
    if (await FileSystem.exists(RETRY_QUEUE_DIRECTORY)) {
        console.error(`[BugsnagPerformance] Clearing persisted data at path: ${RETRY_QUEUE_DIRECTORY}`)
        const files = await FileSystem.ls(RETRY_QUEUE_DIRECTORY)
        for (const file of files) {
            await FileSystem.unlink(`${RETRY_QUEUE_DIRECTORY}/${file}`)
        }
    }
    const nativeDeviceIdFilePath = getNativeDeviceIdFilePath()
    if (await FileSystem.exists(nativeDeviceIdFilePath)) {
        console.error(`[BugsnagPerformance] Clearing persisted data at path: ${nativeDeviceIdFilePath}`)
        await FileSystem.unlink(nativeDeviceIdFilePath)
    }
}
