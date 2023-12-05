import timestampFromFilename from '../../lib/retry-queue/timestamp-from-filename'

describe('timestampFromFilename', () => {
  it.each([
    ['retry-0-a.json', '0'],
    ['retry-1-a.json', '1'],
    ['retry-200000-a.json', '200000'],
    ['retry-1234567890-a.json', '1234567890'],
    ['retry-00000000000-a.json', '0'],
    ['retry-999999999999999999999999999999999999-a.json', '999999999999999999999999999999999999']
  ])('parses %s into the timestamp %s', (input, expected) => {
    // ideally we'd want to do something like this:
    // expect(timestampFromFilename(input)).toBe(BigInt(expected))
    // but Jest can't serialise BigInts yet so we have to use strings for now
    const actual = timestampFromFilename(input)

    expect(actual?.toString()).toBe(expected)
  })

  it.each([
    'retry-a-0.json',
    'retry0a.json',
    'retry-a-a.json',
    'retry-1-a.txt',
    'retry-1-a.json.txt',
    'retry-retry-1-a.json'
  ])('will not parse the invalid filename: %s', (input) => {
    expect(timestampFromFilename(input)).toBeUndefined()
  })
})
