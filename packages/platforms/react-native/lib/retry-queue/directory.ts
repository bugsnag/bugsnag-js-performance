import { isObject } from '@bugsnag/core-performance'
import type { FileSystem } from 'react-native-file-access'
import { Util } from '../persistence'
import timestampFromFilename from './timestamp-from-filename'

export type MinimalFileSystem = Pick<typeof FileSystem, 'ls' | 'exists' | 'isDir' | 'readFile' | 'writeFile' | 'mkdir' | 'unlink'>

// sort filenames by newest -> oldest, i.e. the largest timestamps come first
// any invalid filenames (where we can't parse a timestamp) are put at the end
function filenameSorter (a: string, b: string): number {
  const aTimestamp = timestampFromFilename(a)

  // put invalid filenames at the end of the array
  if (!aTimestamp) {
    return 1
  }

  const bTimestamp = timestampFromFilename(b)

  if (!bTimestamp) {
    return -1
  }

  const delta = bTimestamp - aTimestamp
  if (delta !== 0) {
    return delta
  }

  // if timestamps are equal fall back to default string sorting
  if (a > b) {
    return 1
  }

  if (a < b) {
    return -1
  }

  return 0
}

export default class RetryQueueDirectory {
  private readonly fileSystem: MinimalFileSystem
  private readonly path: string

  constructor (fileSystem: MinimalFileSystem, path: string) {
    this.fileSystem = fileSystem
    this.path = path
  }

  async files (): Promise<string[]> {
    if (!await this.fileSystem.exists(this.path)) {
      return []
    }

    const files: string[] = []

    for (const file of await this.fileSystem.ls(this.path)) {
      if (!await this.fileSystem.isDir(file)) {
        files.push(Util.basename(file))
      }
    }

    files.sort(filenameSorter)

    return files
  }

  async read (name: string): Promise<string> {
    const path = `${this.path}/${Util.basename(name)}`

    if (await this.fileSystem.exists(path)) {
      return await this.fileSystem.readFile(path)
    }

    return ''
  }

  async write (name: string, contents: string): Promise<void> {
    await this.ensureExists()

    const path = `${this.path}/${Util.basename(name)}`

    await this.fileSystem.writeFile(path, contents)
  }

  async delete (name: string): Promise<void> {
    const path = `${this.path}/${Util.basename(name)}`

    if (await this.fileSystem.exists(path)) {
      await this.fileSystem.unlink(path)
    }
  }

  private async ensureExists (): Promise<void> {
    try {
      await this.fileSystem.mkdir(this.path)
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
