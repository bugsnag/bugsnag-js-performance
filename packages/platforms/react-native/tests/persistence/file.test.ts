import File from '../../lib/persistence/file'
import { FileSystem } from 'react-native-file-access'

describe('File', () => {
  beforeEach(() => {
    // reset the FileSystem mock between tests, otherwise they will interfere
    // with each other
    // @ts-expect-error this exists on 'FileSystemMock' (see '__mocks__')
    FileSystem.filesystem = new Map<string, string>()
  })

  it('can write to the given file path', async () => {
    const file = new File('/a/file/path', FileSystem)

    await file.write('some stuff')

    expect(await FileSystem.readFile('/a/file/path')).toStrictEqual('some stuff')
  })

  it('can read from the given file path', async () => {
    const file = new File('/another/file/path', FileSystem)

    await file.write('beep beep')

    expect(await file.read()).toStrictEqual('beep beep')
  })

  it('throws when reading from the file when it does not exist', async () => {
    expect.assertions(1)
    const file = new File('/a/third/file/path', FileSystem)

    await expect(file.read()).rejects.toThrow()
  })

  it('overwrites previously written data on each write', async () => {
    const file = new File('/this/one/is/different/too', FileSystem)

    await file.write('beep')
    expect(await file.read()).toStrictEqual('beep')

    await file.write('boop')
    expect(await file.read()).toStrictEqual('boop')
  })

  it('rethrows errors when creating the directory', async () => {
    expect.assertions(1)
    const file = new File('/a/b/c.txt', FileSystem)

    jest.mocked(FileSystem.mkdir).mockImplementation(() => {
      throw new Error('no')
    })

    await expect(file.write('abc')).rejects.toThrow(new Error('no'))
  })

  it('handles error when directory already exists', async () => {
    const file = new File('/x/y/z.abc', FileSystem)

    jest.mocked(FileSystem.mkdir).mockImplementation(() => {
      const error = new Error('already exists!')
      ;(error as any).code = 'EEXIST'

      throw error
    })

    await file.write('beep')
    expect(await file.read()).toStrictEqual('beep')
  })
})
