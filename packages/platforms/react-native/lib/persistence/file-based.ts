import {
  isDeviceId,
  isPersistedProbability,
  type Persistence,
  type PersistenceKey,
  type PersistedProbability,
  type PersistencePayloadMap
} from '@bugsnag/core-performance'
import type File from './file'

// this is intentionally very loose as the persisted file could contain anything
type PersistedData = Record<string, unknown>

interface DataToBePersisted {
  'device-id'?: string
  'sampling-probability'?: PersistedProbability
}

export default class FileBasedPersistence implements Persistence {
  private readonly file: File
  private saveQueue: Promise<void> = Promise.resolve()

  constructor (file: File) {
    this.file = file
  }

  async load<K extends PersistenceKey> (key: K): Promise<PersistencePayloadMap[K] | undefined> {
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
}
