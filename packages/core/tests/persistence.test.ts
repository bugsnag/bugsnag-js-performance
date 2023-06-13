import { InMemoryPersistence } from '../lib/persistence'

describe('InMemoryPersistence', () => {
  it('can save an item', async () => {
    const persistence = new InMemoryPersistence()
    const probability = {
      value: 0.5,
      time: 12345678
    }

    await persistence.save('bugsnag-sampling-probability', probability)

    const actual = await persistence.load('bugsnag-sampling-probability')

    expect(actual).toStrictEqual(probability)
  })

  it('returns undefined when no item is saved', async () => {
    const persistence = new InMemoryPersistence()

    const actual = await persistence.load('bugsnag-sampling-probability')

    expect(actual).toBeUndefined()
  })
})
