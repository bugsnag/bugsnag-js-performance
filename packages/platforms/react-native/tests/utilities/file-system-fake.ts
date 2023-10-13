enum FileSystemType { File, Directory }

type FileSystemEntry
  = { type: FileSystemType.File, name: string, data: string }
  | { type: FileSystemType.Directory, name: string }

type FileSystem = Map<string, FileSystemEntry>

// TODO: keep?
// function basename (path: string): string {
//   return path.split('/').pop() || '/'
// }

function dirname (path: string): string {
  return path.split('/').slice(0, -1).join('/')
}

export default class FileSystemFake {
  private readonly entries: FileSystem

  constructor () {
    this.entries = new Map()
  }

  async ls (path: string): Promise<string[]> {
    const entry = this.entries.get(path)

    if (!entry) {
      throw new Error(`path does not exist: ${path}`)
    }

    if (entry.type === FileSystemType.File) {
      throw new Error(`cannot ls a file: ${entry.name}`)
    }

    const entries = []

    for (const key of this.entries.keys()) {
      if (key.startsWith(path) && key !== path) {
        entries.push(key)
      }
    }

    return entries
  }

  async exists (path: string): Promise<boolean> {
    return this.entries.has(path)
  }

  async isDir (path: string): Promise<boolean> {
    const entry = this.entries.get(path)

    if (entry) {
      return entry.type === FileSystemType.Directory
    }

    return false
  }

  async readFile (path: string): Promise<string> {
    const entry = this.entries.get(path)

    if (!entry) {
      throw new Error(`path does not exist: ${path}`)
    }

    if (entry.type === FileSystemType.Directory) {
      throw new Error(`cannot call readFile on a directory: ${path}`)
    }

    return entry.data
  }

  async writeFile (path: string, data: string): Promise<void> {
    const directory = dirname(path)
    const entry = this.entries.get(directory)

    if (!entry) {
      throw new Error(`directory does not exist: ${directory}`)
    }

    if (entry.type === FileSystemType.File) {
      throw new Error(`cannot use a file as a directory: ${JSON.stringify(entry)}`)
    }

    this.entries.set(path, {
      type: FileSystemType.File,
      name: path,
      data
    })
  }

  async mkdir (path: string): Promise<string> {
    this.entries.set(path, {
      type: FileSystemType.Directory,
      name: path
    })

    return path
  }

  async unlink (path: string): Promise<void> {
    if (!this.entries.has(path)) {
      throw new Error(`path does not exist: ${path}`)
    }

    this.entries.delete(path)
  }
}
