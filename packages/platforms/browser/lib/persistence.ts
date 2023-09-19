import {
  InMemoryPersistence,
  toPersistedPayload,
  type Persistence,
  type PersistenceKey,
  type PersistencePayloadMap
} from '@bugsnag/core-performance'

interface LocalStorage {
  setItem: (key: string, value: string) => void
  getItem: (key: string) => string | null
}

interface WindowWithLocalStorage {
  localStorage?: LocalStorage
}

function makeBrowserPersistence (window: WindowWithLocalStorage): Persistence {
  // accessing localStorage can throw on some browsers, so we have to catch
  // these errors and provide a fallback
  try {
    if (window.localStorage) {
      return new BrowserPersistence(window.localStorage)
    }
  } catch {}

  // store items in memory if localStorage isn't available
  return new InMemoryPersistence()
}

function toString<K extends PersistenceKey> (key: K, value: PersistencePayloadMap[K]): string {
  switch (key) {
    case 'bugsnag-sampling-probability':
      return JSON.stringify(value)

    case 'bugsnag-anonymous-id':
      return value as string

    default:
      key satisfies never
      return key
  }
}

class BrowserPersistence implements Persistence {
  private readonly storage: LocalStorage

  constructor (localStorage: LocalStorage) {
    this.storage = localStorage
  }

  async load<K extends PersistenceKey> (key: K): Promise<PersistencePayloadMap[K] | undefined> {
    try {
      const raw = this.storage.getItem(key)

      if (raw) {
        return toPersistedPayload(key, raw)
      }
    } catch {}
  }

  async save<K extends PersistenceKey> (key: K, value: PersistencePayloadMap[K]): Promise<void> {
    try {
      this.storage.setItem(key, toString(key, value))
    } catch {}
  }
}

export default makeBrowserPersistence
