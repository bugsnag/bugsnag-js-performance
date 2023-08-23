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
    }
  } catch {}

  // store items in memory if @react-native-async-storage/async-storage isn't available
  return new InMemoryPersistence()
}

class ReactNativePersistence implements Persistence {
  constructor (private readonly storage: AsyncStorageStatic) {}

  async load<K extends PersistenceKey> (key: K): Promise<PersistencePayloadMap[K] | undefined> {
    try {
      const raw = await this.storage.getItem(key)

      if (raw) {
        return toPersistedPayload(key, raw)
      }
    } catch {}
  }

  async save<K extends PersistenceKey> (key: K, value: PersistencePayloadMap[K]): Promise<void> {
    try {
      this.storage.setItem(key, JSON.stringify(value))
    } catch {}
  }
}
