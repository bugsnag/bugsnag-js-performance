/**
 * @jest-environment jsdom
 */

import makeBrowserPersistence from '../lib/persistence'

class LocalStorageFake {
  throwWhenUsed: boolean = false

  private readonly items = new Map<string, string>()

  getItem (key: string): string | null {
    if (this.throwWhenUsed) {
      throw new Error('throwing because of "this.throwWhenUsed"')
    }

    return this.items.get(key) ?? null
  }

  setItem (key: string, value: string): void {
    if (this.throwWhenUsed) {
      throw new Error('throwing because of "this.throwWhenUsed"')
    }

    this.items.set(key, value)
  }
}

describe('BrowserPersistence', () => {
  // JSDOM doesn't clear localStorage between tests, so we need to manually
  beforeEach(localStorage.clear.bind(localStorage))
  afterEach(localStorage.clear.bind(localStorage))

  it('can save sampling probability', async () => {
    const persistence = makeBrowserPersistence(window)
    const probability = {
      value: 1,
      time: 2
    }

    await persistence.save('bugsnag-sampling-probability', probability)

    const actual = await persistence.load('bugsnag-sampling-probability')
    expect(actual).toStrictEqual(probability)
  })

  it('saves to localStorage', async () => {
    const persistence = makeBrowserPersistence(window)
    const probability = {
      value: 3,
      time: 4
    }

    await persistence.save('bugsnag-sampling-probability', probability)

    const json = localStorage.getItem('bugsnag-sampling-probability')
    expect(json).not.toBeNull()

    const actual = JSON.parse(json as string)
    expect(actual).toStrictEqual(probability)
  })

  it('handles localStorage not existing', async () => {
    const persistence = makeBrowserPersistence({})
    const probability = {
      value: 3,
      time: 4
    }

    await persistence.save('bugsnag-sampling-probability', probability)

    const actual = await persistence.load('bugsnag-sampling-probability')
    expect(actual).toStrictEqual(probability)

    // the probability should not have been stored in localStorage because
    // localStorage doesn't exist
    expect(localStorage.getItem('bugsnag-sampling-probability')).toBeNull()
  })

  it('handles localStorage throwing on access', async () => {
    const persistence = makeBrowserPersistence({
      get localStorage (): undefined {
        throw new Error('oh no!')

        // this pointless 'return' exists to fix a typescript compilation error
        // as without it the function returns 'void'
        return undefined // eslint-disable-line
      }
    })

    const probability = {
      value: 3,
      time: 4
    }

    await persistence.save('bugsnag-sampling-probability', probability)

    const actual = await persistence.load('bugsnag-sampling-probability')
    expect(actual).toStrictEqual(probability)

    // the probability should not have been stored in localStorage because
    // localStorage threw when accessed
    expect(localStorage.getItem('bugsnag-sampling-probability')).toBeNull()
  })

  it('handles localStorage throwing on setItem', async () => {
    const localStorage = new LocalStorageFake()

    const persistence = makeBrowserPersistence({ localStorage })
    const probability = {
      value: 1,
      time: 2
    }

    localStorage.throwWhenUsed = true

    await persistence.save('bugsnag-sampling-probability', probability)

    localStorage.throwWhenUsed = false

    // this load won't actually return anything as the save failed
    const actual = await persistence.load('bugsnag-sampling-probability')
    expect(actual).toBeUndefined()
  })

  it('handles localStorage throwing on getItem', async () => {
    const localStorage = new LocalStorageFake()

    const persistence = makeBrowserPersistence({ localStorage })
    const probability = {
      value: 1,
      time: 2
    }

    await persistence.save('bugsnag-sampling-probability', probability)

    localStorage.throwWhenUsed = true

    // this load won't actually return anything as localStorage threw
    const actual = await persistence.load('bugsnag-sampling-probability')
    expect(actual).toBeUndefined()
  })

  it('handles invalid JSON on save', async () => {
    const persistence = makeBrowserPersistence(window)
    const probability = {
      value: 1,
      time: 2
    }

    // add a circular reference so this object can't be stringified
    ;(probability as any).probability = probability

    await persistence.save('bugsnag-sampling-probability', probability)

    localStorage.throwWhenUsed = true

    // this load won't actually return anything as JSON.stringify threw
    const actual = await persistence.load('bugsnag-sampling-probability')
    expect(actual).toBeUndefined()
  })

  it('ignores invalid probability values on load', async () => {
    const localStorage = new LocalStorageFake()

    const persistence = makeBrowserPersistence(window)
    const probability = {
      value: 'not a valid value',
      time: 'not a valid time'
    }

    localStorage.setItem('bugsnag-sampling-probability', JSON.stringify(probability))

    // this load won't return anything as the stored probability is not valid
    const actual = await persistence.load('bugsnag-sampling-probability')
    expect(actual).toBeUndefined()
  })
})
