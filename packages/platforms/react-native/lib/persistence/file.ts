import { isObject } from '@bugsnag/core-performance'
import type { FileSystem } from 'react-native-file-access'
import { Util } from 'react-native-file-access'

export interface ReadableFile {
  read: () => Promise<string>
}

export interface WritableFile {
  write: (data: string) => Promise<void>
}

export type ReadWriteFile = ReadableFile & WritableFile

/**
 * A wrapper around 'react-native-file-access' that allows reading from a
 * specific file without having to specify the path every time it's used
 */
export class ReadOnlyFile implements ReadableFile {
  protected readonly path: string
  protected readonly fileSystem: typeof FileSystem

  constructor (path: string, fileSystem: typeof FileSystem) {
    this.path = path
    this.fileSystem = fileSystem
  }

  async read (): Promise<string> {
    return await this.fileSystem.readFile(this.path)
  }
}

/**
 * Like a 'ReadOnlyFile' but also allows writing to the file
 */
export class File extends ReadOnlyFile implements ReadWriteFile {
  private readonly directory: string

  constructor (path: string, fileSystem: typeof FileSystem) {
    super(path, fileSystem)
    this.directory = Util.dirname(path)
  }

  async write (data: string): Promise<void> {
    await this.ensureDirectoryExists()

    await this.fileSystem.writeFile(this.path, data, 'utf8')
  }

  private async ensureDirectoryExists (): Promise<void> {
    try {
      await this.fileSystem.mkdir(this.directory)
    } catch (err) {
      // on Android mkdir will fail if the directory already exists, which isn't
      // an error case we care about
      // on iOS it will succeed unless there's a genuine error
      if (isObject(err) && err.code !== 'EEXIST') {
        throw err
      }
    }
  }
}

/**
 * Fulfills the 'ReadWriteFile' interface without doing any reading or writing
 */
export class NullFile implements ReadWriteFile {
  async read (): Promise<string> {
    return ''
  }

  async write (data: string): Promise<void> {
  }
}
