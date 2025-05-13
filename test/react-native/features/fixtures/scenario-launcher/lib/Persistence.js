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
    if (await FileSystem.exists(RN_PERSISTED_STATE_PATH)) {
        console.error(`[BugsnagPerformance] Clearing persisted data at path: ${RN_PERSISTED_STATE_PATH}`)
        await FileSystem.unlink(RN_PERSISTED_STATE_PATH)
    }
    if (await FileSystem.exists(RN_RETRY_QUEUE_DIRECTORY)) {
        console.error(`[BugsnagPerformance] Clearing persisted data at path: ${RN_RETRY_QUEUE_DIRECTORY}`)
        const files = await FileSystem.ls(RN_RETRY_QUEUE_DIRECTORY)
        for (const file of files) {
            await FileSystem.unlink(`${RN_RETRY_QUEUE_DIRECTORY}/${file}`)
        }
    }

    // Android Performance SDK persistence (For Cocoa Performance we set the clearPersistenceOnStart config option)
    if (await FileSystem.exists(ANDROID_PERSISTED_STATE_PATH)) {
        console.error(`[BugsnagPerformance] Clearing persisted data at path: ${ANDROID_PERSISTED_STATE_PATH}`)
        await FileSystem.unlink(ANDROID_PERSISTED_STATE_PATH)
    }
    if (await FileSystem.exists(ANDROID_RETRY_QUEUE_DIRECTORY)) {
        console.error(`[BugsnagPerformance] Clearing persisted data at path: ${ANDROID_RETRY_QUEUE_DIRECTORY}`)
        const files = await FileSystem.ls(ANDROID_RETRY_QUEUE_DIRECTORY)
        for (const file of files) {
            await FileSystem.unlink(`${ANDROID_RETRY_QUEUE_DIRECTORY}/${file}`)
        }
    }

    const nativeDeviceIdFilePath = getNativeDeviceIdFilePath()
    if (await FileSystem.exists(nativeDeviceIdFilePath)) {
        console.error(`[BugsnagPerformance] Clearing persisted data at path: ${nativeDeviceIdFilePath}`)
        await FileSystem.unlink(nativeDeviceIdFilePath)
    }
}
