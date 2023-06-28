import {
  type PersistenceKey,
  type PersistencePayload,
  InMemoryPersistence
} from '../lib/persistence'

describe('InMemoryPersistence', () => {
  const payloads: Array<{ key: PersistenceKey, value: PersistencePayload }> = [
    { key: 'bugsnag-sampling-probability', value: { value: 0.5, time: 12345678 } },
    { key: 'bugsnag-anonymous-id', value: 'an anonymous id' }
  ]

  it.each(payloads)('can save $key', async ({ key, value }) => {
    const persistence = new InMemoryPersistence()

    await persistence.save(key, value)

    const actual = await persistence.load(key)

    expect(actual).toStrictEqual(value)
  })

  it.each(payloads)('returns undefined when no $key is saved', async ({ key }) => {
    const persistence = new InMemoryPersistence()

    const actual = await persistence.load(key)

    expect(actual).toBeUndefined()
  })
})
