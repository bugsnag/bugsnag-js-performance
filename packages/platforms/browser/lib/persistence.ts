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

// NOTE: this should be kept in sync with the notifier
// https://github.com/bugsnag/bugsnag-js/blob/next/packages/plugin-browser-device/device.js
function isDeviceId (raw: string): boolean {
  // make sure the persisted value looks like a valid cuid
  return /^c[a-z0-9]{20,32}$/.test(raw)
}

function toPersistedPayload<K extends PersistenceKey> (
  key: K,
  raw: string
): PersistencePayloadMap[K] | undefined {
  switch (key) {
    case 'bugsnag-sampling-probability': {
      const json = JSON.parse(raw)

      return isPersistedProbabilty(json)
        ? json as PersistencePayloadMap[K]
        : undefined
    }

    case 'bugsnag-anonymous-id':
      return isDeviceId(raw)
        ? raw as PersistencePayloadMap[K]
        : undefined

    default: {
      const _exhaustiveCheck: never = key
      return _exhaustiveCheck
    }
  }
}

function toString<K extends PersistenceKey> (key: K, value: PersistencePayloadMap[K]): string {
  switch (key) {
    case 'bugsnag-sampling-probability':
      return JSON.stringify(value)

    case 'bugsnag-anonymous-id':
      return value as string

    default: {
      const _exhaustiveCheck: never = key
      return _exhaustiveCheck
    }
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
