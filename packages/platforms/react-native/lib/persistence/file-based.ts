import {
  isDeviceId,
  isPersistedProbability,
  type Persistence,
  type PersistenceKey,
  type PersistedProbability,
  type PersistencePayloadMap
} from '@bugsnag/core-performance'
import { type ReadWriteFile, type ReadableFile } from './file'
import { Platform } from 'react-native'

// this is intentionally very loose as the persisted file could contain anything
type PersistedData = Record<string, unknown>

interface DataToBePersisted {
  'device-id'?: string
  'sampling-probability'?: PersistedProbability
}

export default class FileBasedPersistence implements Persistence {
  private readonly file: ReadWriteFile
  private readonly nativeDeviceIdFile: ReadableFile
  private readonly nativeDeviceIdJsonKey: string
  private saveQueue: Promise<void> = Promise.resolve()

  constructor (file: ReadWriteFile, nativeDeviceIdFile: ReadableFile) {
    this.file = file
    this.nativeDeviceIdFile = nativeDeviceIdFile

    // https://github.com/bugsnag/bugsnag-cocoa-performance/blob/8d91b55652fededb15ef302daacf993e5917fed4/Sources/BugsnagPerformance/Private/PersistentDeviceID.mm#L181C41-L181C52
    // https://github.com/bugsnag/bugsnag-android-performance/blob/a02d6f2f7417c6d53976ebda9ed8c90b58cb1db1/bugsnag-android-performance/src/main/kotlin/com/bugsnag/android/performance/internal/DeviceIdFilePersistence.kt#L125
    this.nativeDeviceIdJsonKey = Platform.OS === 'ios' ? 'deviceID' : 'id'
  }

  async load<K extends PersistenceKey> (key: K): Promise<PersistencePayloadMap[K] | undefined> {
    // attempt to read the native SDK's device ID file
    // this may not exist as the native SDK isn't necessarily installed or it
    // could have yet to write device ID to disk
    if (key === 'bugsnag-anonymous-id') {
      const nativeDeviceId = await this.readDeviceIdFromNativeSdk()

      if (nativeDeviceId) {
        return nativeDeviceId as PersistencePayloadMap[K]
      }
    }

    const existing = await this.readJson()

    switch (key) {
      case 'bugsnag-anonymous-id':
        return isDeviceId(existing['device-id'])
          ? existing['device-id'] as PersistencePayloadMap[K]
          : undefined

      case 'bugsnag-sampling-probability':
        return isPersistedProbability(existing['sampling-probability'])
          ? existing['sampling-probability'] as PersistencePayloadMap[K]
          : undefined
    }

    key satisfies never
  }

  async save<K extends PersistenceKey> (key: K, value: PersistencePayloadMap[K]): Promise<void> {
    this.saveQueue = this.saveQueue.then(async () => {
      const existing = await this.readJson()
      const dataToBePersisted: DataToBePersisted = {}

      // validate the existing data (if there is any) to try to keep the file as
      // clean as possible
      // this also ensures no extra keys end up in the file
      if (isDeviceId(existing['device-id'])) {
        dataToBePersisted['device-id'] = existing['device-id']
      }

      if (isPersistedProbability(existing['sampling-probability'])) {
        dataToBePersisted['sampling-probability'] = existing['sampling-probability']
      }

      // map the key from core to the key we use in the file
      switch (key) {
        case 'bugsnag-anonymous-id':
          dataToBePersisted['device-id'] = value as string
          break

        case 'bugsnag-sampling-probability':
          dataToBePersisted['sampling-probability'] = value as PersistedProbability
          break

        default:
          key satisfies never
      }

      try {
        await this.file.write(JSON.stringify(dataToBePersisted))
      } catch {}
    })

    await this.saveQueue
  }

  private async readJson (): Promise<PersistedData> {
    try {
      return JSON.parse(await this.file.read())
    } catch (err) {
      return {}
    }
  }

  private async readDeviceIdFromNativeSdk (): Promise<string | undefined> {
    try {
      const contents = await this.nativeDeviceIdFile.read()

      return JSON.parse(contents)[this.nativeDeviceIdJsonKey]
    } catch {
    }
  }
}
