import {
  InMemoryPersistence,
  isObject,
  toPersistedPayload,
  type Persistence,
  type PersistenceKey,
  type PersistencePayloadMap
} from '@bugsnag/core-performance'
import { type AsyncStorageStatic } from '@react-native-async-storage/async-storage'

const isAsyncStorage = (value: unknown): value is AsyncStorageStatic => isObject(value) && typeof value.getItem === 'function' && typeof value.setItem === 'function'

export function getReactNativePersistence (): Persistence {
  // use @react-native-async-storage/async-storage if it's installed
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const asyncStorage = require('@react-native-async-storage/async-storage').default
    if (isAsyncStorage(asyncStorage)) {
      return new ReactNativePersistence(asyncStorage)
    } else {
      console.error('[BugsnagPerformance] async storage was not valid', asyncStorage)
    }
  } catch (err) {
    console.error('[BugsnagPerformance] error loading AsyncStorage', err)
  }

  // store items in memory if @react-native-async-storage/async-storage isn't available
  return new InMemoryPersistence()
}

class ReactNativePersistence implements Persistence {
  constructor (private readonly storage: AsyncStorageStatic) {}

  async load<K extends PersistenceKey> (key: K): Promise<PersistencePayloadMap[K] | undefined> {
    console.log(`[BugsnagPerformance] load ${key}`)

    try {
      const raw = await this.storage.getItem(key)

      if (raw) {
        console.log(`[BugsnagPerformance] raw value: ${raw}`)
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
