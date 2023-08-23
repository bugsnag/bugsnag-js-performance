import {
  InMemoryPersistence,
  toPersistedPayload,
  type Persistence,
  type PersistenceKey,
  type PersistencePayloadMap
} from '@bugsnag/core-performance'
import AsyncStorage, { type AsyncStorageStatic } from '@react-native-async-storage/async-storage'

export function getReactNativePersistence (): Persistence {
  // use @react-native-async-storage/async-storage if it's installed
  try {
    if (AsyncStorage) return new ReactNativePersistence(AsyncStorage)
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
