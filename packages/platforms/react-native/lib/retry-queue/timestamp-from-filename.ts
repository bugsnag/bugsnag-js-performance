const FILENAME_REGEX = /^retry-([0-9]+)-.+\.json$/

export default function timestampFromFilename (filename: string): number | undefined {
  const match = FILENAME_REGEX.exec(filename)

  if (match) {
    return Number(match[1])
  }
}
