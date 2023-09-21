import FileBasedPersistence from '../lib/persistence'
import { FileSystem } from 'react-native-file-access'

describe('FileBasedPersistence', () => {
  it('returns undefined for a key with no persisted value', async () => {
    const persistence = new FileBasedPersistence(FileSystem)

    expect(await persistence.load('bugsnag-anonymous-id')).toBeUndefined()
  })
})
