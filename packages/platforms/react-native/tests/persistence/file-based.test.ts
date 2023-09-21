import File from '../../lib/persistence/file'
import FileBasedPersistence from '../../lib/persistence/file-based'
import { FileSystem } from 'react-native-file-access'

const PATH = '/test/path/persistent-state.json'

describe('FileBasedPersistence', () => {
  beforeEach(() => {
    // reset the FileSystem mock between tests, otherwise they will interfere
    // with each other
    // @ts-expect-error this exists on 'FileSystemMock' (see '__mocks__')
    FileSystem.filesystem = new Map<string, string>()
  })

  it('returns undefined for a key with no persisted value', async () => {
    const persistence = new FileBasedPersistence(new File(PATH, FileSystem))

    expect(await persistence.load('bugsnag-anonymous-id')).toBeUndefined()
    expect(await persistence.load('bugsnag-sampling-probability')).toBeUndefined()
  })

  it('can save sampling probability', async () => {
    const file = new File(PATH, FileSystem)
    const persistence = new FileBasedPersistence(file)
    const samplingProbability = { value: 0.5, time: 12345678 }

    await persistence.save('bugsnag-sampling-probability', samplingProbability)

    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual(samplingProbability)
    expect(JSON.parse(await file.read())).toStrictEqual({ 'sampling-probability': samplingProbability })
  })

  it('can save device ID', async () => {
    const file = new File(PATH, FileSystem)
    const persistence = new FileBasedPersistence(file)

    await persistence.save('bugsnag-anonymous-id', 'cuidcuidcuidcuidcuidcuidcuidcuid')

    expect(await persistence.load('bugsnag-anonymous-id')).toStrictEqual('cuidcuidcuidcuidcuidcuidcuidcuid')
    expect(JSON.parse(await file.read())).toStrictEqual({ 'device-id': 'cuidcuidcuidcuidcuidcuidcuidcuid' })
  })

  it('can save both keys', async () => {
    const file = new File(PATH, FileSystem)
    const persistence = new FileBasedPersistence(file)
    const samplingProbability = { value: 0.5, time: 12345678 }

    await persistence.save('bugsnag-anonymous-id', 'cuidcuidcuidcuidcuidcuidcuidcuid')
    await persistence.save('bugsnag-sampling-probability', samplingProbability)

    expect(await persistence.load('bugsnag-anonymous-id')).toStrictEqual('cuidcuidcuidcuidcuidcuidcuidcuid')
    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual(samplingProbability)

    expect(JSON.parse(await file.read())).toStrictEqual({
      'device-id': 'cuidcuidcuidcuidcuidcuidcuidcuid',
      'sampling-probability': samplingProbability
    })
  })

  it('can overwrite an existing persisted sampling probability', async () => {
    const file = new File(PATH, FileSystem)
    const persistence = new FileBasedPersistence(file)
    const samplingProbability1 = {
      value: 1.0,
      time: 987654321
    }

    await persistence.save('bugsnag-sampling-probability', samplingProbability1)

    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual(samplingProbability1)
    expect(JSON.parse(await file.read())).toStrictEqual({ 'sampling-probability': samplingProbability1 })

    const samplingProbability2 = {
      value: 0.25,
      time: 918273645
    }

    await persistence.save('bugsnag-sampling-probability', samplingProbability2)

    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual(samplingProbability2)
    expect(JSON.parse(await file.read())).toStrictEqual({ 'sampling-probability': samplingProbability2 })
  })

  it('can overwrite an existing persisted device ID', async () => {
    const file = new File(PATH, FileSystem)
    const persistence = new FileBasedPersistence(file)

    await persistence.save('bugsnag-anonymous-id', 'cuidcuidcuidcuidcuidcuidcuidcuid')

    expect(await persistence.load('bugsnag-anonymous-id')).toStrictEqual('cuidcuidcuidcuidcuidcuidcuidcuid')
    expect(JSON.parse(await file.read())).toStrictEqual({ 'device-id': 'cuidcuidcuidcuidcuidcuidcuidcuid' })

    await persistence.save('bugsnag-anonymous-id', 'cuidabcabcabcabcabcabcabcabc')

    expect(await persistence.load('bugsnag-anonymous-id')).toStrictEqual('cuidabcabcabcabcabcabcabcabc')
    expect(JSON.parse(await file.read())).toStrictEqual({ 'device-id': 'cuidabcabcabcabcabcabcabcabc' })
  })

  it('does not remove sampling probability when overwriting device ID', async () => {
    const samplingProbability = { value: 0.1, time: 12345 }
    const file = new File(PATH, FileSystem)
    await file.write(JSON.stringify({
      'device-id': 'cuidcuidcuidcuidcuidcuidcuidcuid',
      'sampling-probability': samplingProbability
    }))

    const persistence = new FileBasedPersistence(file)

    await persistence.save('bugsnag-anonymous-id', 'cuidabcabcabcabcabcabcabcabc')

    expect(await persistence.load('bugsnag-anonymous-id')).toStrictEqual('cuidabcabcabcabcabcabcabcabc')
    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual(samplingProbability)
    expect(JSON.parse(await file.read())).toStrictEqual({
      'device-id': 'cuidabcabcabcabcabcabcabcabc',
      'sampling-probability': samplingProbability
    })
  })

  it('does not remove device ID when overwriting sampling probability', async () => {
    const samplingProbability1 = { value: 0.1, time: 12345 }
    const file = new File(PATH, FileSystem)
    await file.write(JSON.stringify({
      'device-id': 'cuidcuidcuidcuidcuidcuidcuidcuid',
      'sampling-probability': samplingProbability1
    }))

    const persistence = new FileBasedPersistence(file)

    const samplingProbability2 = { value: 0.5, time: 98765 }
    await persistence.save('bugsnag-sampling-probability', samplingProbability2)

    expect(await persistence.load('bugsnag-anonymous-id')).toStrictEqual('cuidcuidcuidcuidcuidcuidcuidcuid')
    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual(samplingProbability2)
    expect(JSON.parse(await file.read())).toStrictEqual({
      'device-id': 'cuidcuidcuidcuidcuidcuidcuidcuid',
      'sampling-probability': samplingProbability2
    })
  })

  it('can load an existing sampling probability from the file', async () => {
    const samplingProbability = { value: 0.75, time: 987654321 }
    const file = new File(PATH, FileSystem)
    await file.write(JSON.stringify({ 'sampling-probability': samplingProbability }))
    const persistence = new FileBasedPersistence(file)

    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual(samplingProbability)
  })

  it('ignores invalid probability values on load', async () => {
    const file = new File(PATH, FileSystem)
    await file.write('{ "sampling-probability": 1234 }')

    const persistence = new FileBasedPersistence(file)

    expect(await persistence.load('bugsnag-sampling-probability')).toBeUndefined()
    expect(await file.read()).toStrictEqual('{ "sampling-probability": 1234 }')
  })

  it('ignores invalid existing probability values when saving', async () => {
    const file = new File(PATH, FileSystem)
    await file.write('{ "sampling-probability": 1234 }')

    expect(await file.read()).toStrictEqual('{ "sampling-probability": 1234 }')

    const persistence = new FileBasedPersistence(file)
    await persistence.save('bugsnag-anonymous-id', 'cuidcuidcuidcuidcuidcuidcuidcuid')

    expect(JSON.parse(await file.read())).toStrictEqual({
      'device-id': 'cuidcuidcuidcuidcuidcuidcuidcuid'
    })
  })

  it('can load an existing device ID from the file', async () => {
    const file = new File(PATH, FileSystem)
    await file.write('{ "device-id": "cuidcuidcuidcuidcuidcuidcuidcuid" }')

    const persistence = new FileBasedPersistence(file)

    expect(await persistence.load('bugsnag-anonymous-id')).toStrictEqual('cuidcuidcuidcuidcuidcuidcuidcuid')
  })

  it('ignores invalid device ID values on load', async () => {
    const file = new File(PATH, FileSystem)
    await file.write('{ "device-id": "not a cuid" }')

    const persistence = new FileBasedPersistence(file)

    expect(await persistence.load('bugsnag-anonymous-id')).toBeUndefined()
    expect(await file.read()).toStrictEqual('{ "device-id": "not a cuid" }')
  })

  it('ignores invalid existing device ID values when saving', async () => {
    const file = new File(PATH, FileSystem)
    await file.write('{ "device-id": "abc" }')

    expect(await file.read()).toStrictEqual('{ "device-id": "abc" }')

    const persistence = new FileBasedPersistence(file)
    const samplingProbability = { value: 0.1, time: 1234 }

    await persistence.save('bugsnag-sampling-probability', samplingProbability)

    expect(JSON.parse(await file.read())).toStrictEqual({
      'sampling-probability': samplingProbability
    })
  })

  it('can handle an empty existing file', async () => {
    const file = new File(PATH, FileSystem)
    await file.write('')

    const persistence = new FileBasedPersistence(file)

    expect(await persistence.load('bugsnag-anonymous-id')).toBeUndefined()
    expect(await persistence.load('bugsnag-sampling-probability')).toBeUndefined()

    await persistence.save('bugsnag-anonymous-id', 'cuidcuidcuidcuidcuidcuidcuidcuid')

    expect(await persistence.load('bugsnag-anonymous-id')).toStrictEqual('cuidcuidcuidcuidcuidcuidcuidcuid')
  })

  it('can handle invalid JSON in existing file', async () => {
    const file = new File(PATH, FileSystem)
    await file.write('{ "device-id": "cuidabcabcabcabcabcabcabcabc", "sampling-probability": {')

    const persistence = new FileBasedPersistence(file)

    expect(await persistence.load('bugsnag-anonymous-id')).toBeUndefined()
    expect(await persistence.load('bugsnag-sampling-probability')).toBeUndefined()

    const samplingProbability = { value: 0.25, time: 123987 }
    await persistence.save('bugsnag-sampling-probability', samplingProbability)

    expect(await persistence.load('bugsnag-sampling-probability')).toStrictEqual(samplingProbability)
  })

  it('can handle concurrent calls to load', async () => {
    const file = new File(PATH, FileSystem)
    await file.write(JSON.stringify({
      'device-id': 'cuidcuidcuidcuidcuidcuidcuidcuid',
      'sampling-probability': { value: 0.9, time: 999 }
    }))

    const persistence = new FileBasedPersistence(file)

    const loads = await Promise.all([
      persistence.load('bugsnag-sampling-probability'),
      persistence.load('bugsnag-anonymous-id'),
      persistence.load('bugsnag-sampling-probability'),
      persistence.load('bugsnag-anonymous-id'),
      persistence.load('bugsnag-sampling-probability'),
      persistence.load('bugsnag-anonymous-id'),
      persistence.load('bugsnag-anonymous-id')
    ])

    expect(loads).toStrictEqual([
      { value: 0.9, time: 999 },
      'cuidcuidcuidcuidcuidcuidcuidcuid',
      { value: 0.9, time: 999 },
      'cuidcuidcuidcuidcuidcuidcuidcuid',
      { value: 0.9, time: 999 },
      'cuidcuidcuidcuidcuidcuidcuidcuid',
      'cuidcuidcuidcuidcuidcuidcuidcuid'
    ])
  })

  it('can handle concurrent calls to save', async () => {
    const file = new File(PATH, FileSystem)
    const persistence = new FileBasedPersistence(file)

    await Promise.all([
      persistence.save('bugsnag-sampling-probability', { value: 0.1, time: 11111 }),
      persistence.save('bugsnag-anonymous-id', 'cuidcuidcuidcuidcuidcuidcuidcuid1'),
      persistence.save('bugsnag-sampling-probability', { value: 0.2, time: 22222 }),
      persistence.save('bugsnag-sampling-probability', { value: 0.3, time: 33333 }),
      persistence.save('bugsnag-anonymous-id', 'cuidcuidcuidcuidcuidcuidcuidcuid2'),
      persistence.save('bugsnag-sampling-probability', { value: 0.4, time: 44444 }),
      persistence.save('bugsnag-sampling-probability', { value: 0.5, time: 55555 }),
      persistence.save('bugsnag-anonymous-id', 'cuidcuidcuidcuidcuidcuidcuidcuid3'),
      persistence.save('bugsnag-anonymous-id', 'cuidcuidcuidcuidcuidcuidcuidcuid4')
    ])

    expect(JSON.parse(await file.read())).toStrictEqual({
      'device-id': 'cuidcuidcuidcuidcuidcuidcuidcuid4',
      'sampling-probability': { value: 0.5, time: 55555 }
    })
  })
})
