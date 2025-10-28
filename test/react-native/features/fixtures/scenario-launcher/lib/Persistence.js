import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const PERSISTED_STATE_VERSION = 1
const RN_PERSISTED_STATE_DIRECTORY = `${Dirs.CacheDir}/bugsnag-performance-react-native/v${PERSISTED_STATE_VERSION}`
const RN_PERSISTED_STATE_PATH = `${RN_PERSISTED_STATE_DIRECTORY}/persisted-state.json`
const RN_RETRY_QUEUE_DIRECTORY = `${RN_PERSISTED_STATE_DIRECTORY}/retry-queue`

const ANDROID_PERSISTED_STATE_DIRECTORY = `${Dirs.CacheDir}/bugsnag-performance/v${PERSISTED_STATE_VERSION}`
const ANDROID_PERSISTED_STATE_PATH = `${ANDROID_PERSISTED_STATE_DIRECTORY}/persistent-state.json`
const ANDROID_RETRY_QUEUE_DIRECTORY = `${ANDROID_PERSISTED_STATE_DIRECTORY}/retry-queue`

function getNativeDeviceIdFilePath () {
    const nativeDeviceIdFilePath = Platform.select({
        ios: undefined,
        android: `${Dirs.DocumentDir}/device-id`,
        default: undefined
      })

    return nativeDeviceIdFilePath
}

async function clearDirectory(directory) {
    if (await FileSystem.exists(directory)) {
        console.error(`[BugsnagPerformance] Clearing persisted data at path: ${directory}`)
        const files = await FileSystem.ls(directory)
        for (const file of files) {
            await FileSystem.unlink(`${directory}/${file}`)
        }
    }
}

async function deleteFile(filePath) {
    if (await FileSystem.exists(filePath)) {
        console.error(`[BugsnagPerformance] Clearing persisted data at path: ${filePath}`)
        await FileSystem.unlink(filePath)
    }
}

async function writePersistedStateFile(contents) {
    if (!await FileSystem.exists(RN_PERSISTED_STATE_DIRECTORY)) {
        console.error(`[BugsnagPerformance] creating persisted state directory: ${RN_PERSISTED_STATE_DIRECTORY}`)
        await FileSystem.mkdir(RN_PERSISTED_STATE_DIRECTORY)
    }

    console.error(`[BugsnagPerformance] writing to: ${RN_PERSISTED_STATE_PATH}`)

    await FileSystem.writeFile(
        RN_PERSISTED_STATE_PATH,
        JSON.stringify(contents)
    )

    console.error(`[BugsnagPerformance] finished writing to: ${RN_PERSISTED_STATE_PATH}`)
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
    // React Native Performance SDK persistence
    await deleteFile(RN_PERSISTED_STATE_PATH)
    await clearDirectory(RN_RETRY_QUEUE_DIRECTORY)

    // Android Performance SDK persistence (For Cocoa Performance we set the clearPersistenceOnStart config option)
    await deleteFile(ANDROID_PERSISTED_STATE_PATH)
    await clearDirectory(ANDROID_RETRY_QUEUE_DIRECTORY)

    const nativeDeviceIdFilePath = getNativeDeviceIdFilePath()
    await deleteFile(nativeDeviceIdFilePath)
}
 