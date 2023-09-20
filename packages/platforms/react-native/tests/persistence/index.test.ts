import persistenceFactory from '../../lib/persistence'
import FileBasedPersistence from '../../lib/persistence/file-based'
import { FileSystem } from 'react-native-file-access'

const EXPECTED_PATH = '/mock/CacheDir/bugsnag-performance-react-native/v1/persisted-state.json'

describe('persistenceFactory', () => {
  beforeEach(() => {
    // reset the FileSystem mock between tests, otherwise they will interfere
    // with each other
    // @ts-expect-error this exists on 'FileSystemMock' (see '__mocks__')
    FileSystem.filesystem = new Map<string, string>()
  })

  it('returns a FileBasedPersistence', async () => {
    expect(persistenceFactory(FileSystem)).toBeInstanceOf(FileBasedPersistence)
  })

  it('uses the correct path to persisted-state.json', async () => {
    const persistence = persistenceFactory(FileSystem)

    expect(await FileSystem.exists(EXPECTED_PATH)).toBe(false)

    await persistence.save('bugsnag-anonymous-id', 'cuidabcabcabcabcabcabcabcabc')

    expect(await FileSystem.exists(EXPECTED_PATH)).toBe(true)

    expect(JSON.parse(await FileSystem.readFile(EXPECTED_PATH))).toStrictEqual({
      'device-id': 'cuidabcabcabcabcabcabcabcabc'
    })
  })
})
