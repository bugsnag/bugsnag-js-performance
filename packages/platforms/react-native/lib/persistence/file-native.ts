import NativeBugsnagPerformance from '../native'

export const Dirs: {
  CacheDir: string
  DocumentDir: string
} = NativeBugsnagPerformance.getNativeConstants()

export const FileSystem = {
  exists (path: string) {
    return NativeBugsnagPerformance.exists(path)
  },
  isDir (path: string) {
    return NativeBugsnagPerformance.isDir(path)
  },
  ls (path: string) {
    return NativeBugsnagPerformance.ls(path)
  },
  mkdir (path: string) {
    return NativeBugsnagPerformance.mkdir(path)
  },
  readFile (path: string, encoding: string = 'utf8') {
    return NativeBugsnagPerformance.readFile(path, encoding)
  },
  unlink (path: string) {
    return NativeBugsnagPerformance.unlink(path)
  },
  writeFile (path: string, data: string, encoding: string = 'utf8') {
    return NativeBugsnagPerformance.writeFile(path, data, encoding)
  }
}
