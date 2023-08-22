import {
  type Persistence,
  type PersistenceKey,
  type PersistencePayloadMap,
  toPersistedPayload,
  InMemoryPersistence
} from '@bugsnag/core-performance'
import type { AsyncStorageStatic } from '@react-native-async-storage/async-storage'

export function getReactNativePersistence (): Persistence {
  // accessing localStorage can throw on some browsers, so we have to catch
  // these errors and provide a fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require('@react-native-async-storage/async-storage')

    if (AsyncStorage) {
      return new ReactNativePersistence(AsyncStorage)
    }
  } catch {}

  // store items in memory if localStorage isn't available
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
