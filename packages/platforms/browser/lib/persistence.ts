import {
  type Persistence,
  type PersistenceKey,
  type PersistencePayloadMap,
  isPersistedProbabilty,
  InMemoryPersistence
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

class BrowserPersistence implements Persistence {
  private readonly storage: LocalStorage

  constructor (localStorage: LocalStorage) {
    this.storage = localStorage
  }

  async load<K extends PersistenceKey> (key: K): Promise<PersistencePayloadMap[K] | undefined> {
    try {
      const json = this.storage.getItem(key)

      if (!json) {
        return
      }

      const item = JSON.parse(json)

      if (isPersistedProbabilty(item)) {
        return item as PersistencePayloadMap[K]
      }
    } catch {}
  }

  async save<K extends PersistenceKey> (key: K, value: PersistencePayloadMap[K]): Promise<void> {
    try {
      this.storage.setItem(key, JSON.stringify(value))
    } catch {}
  }
}

export default makeBrowserPersistence
