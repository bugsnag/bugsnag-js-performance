import {
  toPersistedPayload,
  type Persistence,
  type PersistenceKey,
  type PersistencePayloadMap
} from '@bugsnag/core-performance'
import AsyncStorage from '@react-native-async-storage/async-storage'

export function getReactNativePersistence (): Persistence {
  return new ReactNativePersistence()
}

class ReactNativePersistence implements Persistence {
  async load<K extends PersistenceKey> (key: K): Promise<PersistencePayloadMap[K] | undefined> {
    try {
      const raw = await AsyncStorage.getItem(key)

      if (raw) {
        return toPersistedPayload(key, raw)
      }
    } catch {}
  }

  async save<K extends PersistenceKey> (key: K, value: PersistencePayloadMap[K]): Promise<void> {
    try {
      AsyncStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }
}
