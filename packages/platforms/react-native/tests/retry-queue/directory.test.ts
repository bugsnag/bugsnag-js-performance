import RetryQueueDirectory from '../../lib/retry-queue/directory'
import FileSystemFake from '../utilities/file-system-fake'

describe('RetryQueueDirectory', () => {
  describe('list', () => {
    it('lists all files in directory', async () => {
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/a/b/c')

      await fileSystem.mkdir('/a/b/c')

      await Promise.all([
        fileSystem.writeFile('/a/b/c/retry-1-d.json', ''),
        fileSystem.writeFile('/a/b/c/retry-4-z.json', ''),
        fileSystem.writeFile('/a/b/c/retry-3-a.json', ''),
        fileSystem.writeFile('/a/b/c/retry-2-x.json', '')
      ])

      expect(await directory.files()).toStrictEqual([
        'retry-4-z.json',
        'retry-3-a.json',
        'retry-2-x.json',
        'retry-1-d.json'
      ])
    })

    it('sorts invalid filenames to the end', async () => {
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/x/y/z')

      await fileSystem.mkdir('/x/y/z')

      await Promise.all([
        fileSystem.writeFile('/x/y/z/retry-12-x.json', ''),
        fileSystem.writeFile('/x/y/z/retry-x-2.json', ''), // invalid
        fileSystem.writeFile('/x/y/z/retry-45-y.json', ''),
        fileSystem.writeFile('/x/y/z/retry-34-d.json', ''),
        fileSystem.writeFile('/x/y/z/:).json', ''), // invalid
        fileSystem.writeFile('/x/y/z/retry-23-j.json', '')
      ])

      expect(await directory.files()).toStrictEqual([
        'retry-45-y.json',
        'retry-34-d.json',
        'retry-23-j.json',
        'retry-12-x.json',
        // invalid:
        'retry-x-2.json',
        ':).json'
      ])
    })

    it('ignores sub-directories', async () => {
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/aaa')

      await Promise.all([
        fileSystem.mkdir('/aaa'),
        fileSystem.mkdir('/aaa/d'),
        fileSystem.mkdir('/aaa/e')
      ])

      await Promise.all([
        fileSystem.writeFile('/aaa/retry-1-d.json', ''),
        fileSystem.writeFile('/aaa/retry-4-z.json', ''),
        fileSystem.writeFile('/aaa/retry-3-a.json', ''),
        fileSystem.writeFile('/aaa/retry-2-x.json', '')
      ])

      expect(await directory.files()).toStrictEqual([
        'retry-4-z.json',
        'retry-3-a.json',
        'retry-2-x.json',
        'retry-1-d.json'
      ])

      expect(await fileSystem.ls('/aaa')).toStrictEqual([
        '/aaa/d',
        '/aaa/e',
        '/aaa/retry-1-d.json',
        '/aaa/retry-4-z.json',
        '/aaa/retry-3-a.json',
        '/aaa/retry-2-x.json'
      ])
    })

    it('ignores files in other directories', async () => {
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/a')

      await Promise.all([
        fileSystem.mkdir('/a'),
        fileSystem.mkdir('/b'),
        fileSystem.mkdir('/c')
      ])

      await Promise.all([
        fileSystem.writeFile('/a/retry-1-d.json', ''),
        fileSystem.writeFile('/b/retry-4-z.json', ''),
        fileSystem.writeFile('/c/retry-3-a.json', ''),
        fileSystem.writeFile('/a/retry-2-x.json', ''),
        fileSystem.writeFile('/b/retry-7-o.json', ''),
        fileSystem.writeFile('/c/retry-9-p.json', '')
      ])

      expect(await directory.files()).toStrictEqual([
        'retry-2-x.json',
        'retry-1-d.json'
      ])
    })

    it('returns an empty list if the directory does not exist', async () => {
      const directory = new RetryQueueDirectory(new FileSystemFake(), '/a/directory')

      expect(await directory.files()).toStrictEqual([])
    })

    it('returns an empty list if the directory is empty', async () => {
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/a/directory')

      await fileSystem.mkdir('/a/directory')

      expect(await directory.files()).toStrictEqual([])
    })
  })

  describe('read', () => {
    it('reads the contents of the given file', async () => {
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/a')

      await fileSystem.mkdir('/a')
      await fileSystem.writeFile('/a/b.txt', 'hey there')

      expect(await directory.read('b.txt')).toStrictEqual('hey there')
    })

    it('returns an empty string if the file does not exist', async () => {
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/a')

      await fileSystem.mkdir('/a')

      expect(await directory.read('b.txt')).toStrictEqual('')
    })

    it('returns an empty string if the directory does not exist', async () => {
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/a')

      expect(await directory.read('b.txt')).toStrictEqual('')
    })

    it('does not traverse sub-directories', async () => {
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/a')

      await fileSystem.mkdir('/a')
      await fileSystem.mkdir('/a/b')
      await fileSystem.writeFile('/a/b/c.txt', ':)')

      expect(await directory.read('b/c.txt')).toStrictEqual('')
    })
  })

  describe('write', () => {
    it('writes to the given file', async () => {
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/x')

      await fileSystem.mkdir('/x')
      await directory.write('y.z', 'hello')

      expect(await directory.read('y.z')).toStrictEqual('hello')
    })

    it('will create the directory if it does not exist', async () => {
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/a')

      await directory.write('b.c', 'hi')

      expect(await directory.read('b.c')).toStrictEqual('hi')
      expect(await fileSystem.exists('/a/b.c')).toBe(true)
    })
  })
})
