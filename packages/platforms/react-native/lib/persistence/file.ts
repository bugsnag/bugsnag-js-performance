import { isObject } from '@bugsnag/core-performance'
import { Util, type FileSystem } from 'react-native-file-access'

/**
 * A wrapper around 'react-native-file-access' that allows reading and writing
 * to a specific file without having to specify the path every time it's used
 */
export default class File {
  private readonly path: string
  private readonly directory: string
  private readonly fileSystem: typeof FileSystem

  constructor (path: string, fileSystem: typeof FileSystem) {
    this.path = path
    this.directory = Util.dirname(path)
    this.fileSystem = fileSystem
  }

  async read (): Promise<string> {
    return await this.fileSystem.readFile(this.path)
  }

  async write (data: string): Promise<void> {
    await this.ensureDirectoryExists()

    await this.fileSystem.writeFile(this.path, data, 'utf8')
  }

  async ensureDirectoryExists (): Promise<void> {
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
