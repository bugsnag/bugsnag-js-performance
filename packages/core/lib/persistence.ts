export interface PersistedProbability {
  value: number
  time: number
}

export interface PersistencePayloadMap {
  'bugsnag-sampling-probability': PersistedProbability
  // used for device ID
  'bugsnag-anonymous-id': string
}

export type PersistenceKey = keyof PersistencePayloadMap
export type PersistencePayload = PersistencePayloadMap[PersistenceKey]

export interface Persistence {
  load: <K extends PersistenceKey>(key: K) => Promise<PersistencePayloadMap[K] | undefined>
  save: <K extends PersistenceKey>(key: K, value: PersistencePayloadMap[K]) => Promise<void>
}

export class InMemoryPersistence implements Persistence {
  private readonly persistedItems = new Map<PersistenceKey, PersistencePayload>()

  async load<K extends PersistenceKey> (key: K): Promise<PersistencePayloadMap[K] | undefined> {
    return this.persistedItems.get(key) as PersistencePayloadMap[K] | undefined
  }

  async save<K extends PersistenceKey> (key: K, value: PersistencePayloadMap[K]): Promise<void> {
    this.persistedItems.set(key, value)
  }
}
