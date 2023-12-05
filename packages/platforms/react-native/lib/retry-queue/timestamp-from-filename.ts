const FILENAME_REGEX = /^retry-([0-9]+)-.+\.json$/

export default function timestampFromFilename (filename: string): bigint | undefined {
  const match = FILENAME_REGEX.exec(filename)

  if (match) {
    return BigInt(match[1])
  }
}
