import {
  type Persistence,
  type PersistenceKey,
  type PersistencePayloadMap
} from '@bugsnag/core-performance'
import { type FileSystem } from 'react-native-file-access'

export default class FileBasedPersistence implements Persistence {
  private fileSystem: typeof FileSystem

  constructor (fileSystem: typeof FileSystem) {
    this.fileSystem = fileSystem
  }

  async load<K extends PersistenceKey> (key: K): Promise<PersistencePayloadMap[K] | undefined> {
    return undefined
  }

  async save<K extends PersistenceKey> (key: K, value: PersistencePayloadMap[K]): Promise<void> {
  }
}
