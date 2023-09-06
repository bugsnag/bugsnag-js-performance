import {
  toPersistedPayload,
  type Persistence,
  type PersistenceKey,
  type PersistencePayloadMap
} from '@bugsnag/core-performance'
import AsyncStorage, { type AsyncStorageStatic } from '@react-native-async-storage/async-storage'

export function getReactNativePersistence (): Persistence {
  return new ReactNativePersistence(AsyncStorage)
}

class ReactNativePersistence implements Persistence {
  constructor (private readonly storage: AsyncStorageStatic) {}

  async load<K extends PersistenceKey> (key: K): Promise<PersistencePayloadMap[K] | undefined> {
    console.log(`[BugsnagPerformance] load ${key}`)

    try {
      const raw = await this.storage.getItem(key)

      if (raw) {
        const payload = toPersistedPayload(key, raw)
        console.log(`[BugsnagPerformance] parsed value: ${payload}`)
        return payload
      } else {
        console.log(`[BugsnagPerformance] no value to load for key ${key}`)
      }
    } catch (err) {
      console.error(`[BugsnagPerformance] error loading ${key}`, err)
    }
  }

  async save<K extends PersistenceKey> (key: K, value: PersistencePayloadMap[K]): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      console.log(`[BugsnagPerformance] save ${key} with value ${stringValue}`)
      this.storage.setItem(key, stringValue)
    } catch (err) {
      console.error(`[BugsnagPerformance] error saving ${key}`, err)
    }
  }
}
