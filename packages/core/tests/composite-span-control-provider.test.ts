import { CompositeSpanControlProvider, SpanQuery } from '../lib/span-control-provider'
import type { SpanControlProvider } from '../lib/span-control-provider'

class TestSpanQuery extends SpanQuery<TestSpanControl> {
  constructor (public readonly value: string | null) {
    super()
  }
}

class UnsupportedSpanQuery extends SpanQuery<TestSpanControl> {
  constructor (public readonly value: string) {
    super()
  }
}
class TestSpanControl {
  constructor (public readonly value: string | null) {}
}

// Test implementation of SpanControlProvider
class TestSpanControlProvider implements SpanControlProvider<TestSpanControl> {
  private readonly expectedQuery: TestSpanQuery
  private readonly returnedControls: TestSpanControl

  constructor (expectedQuery: TestSpanQuery, returnControls?: TestSpanControl) {
    this.expectedQuery = expectedQuery
    this.returnedControls = returnControls || new TestSpanControl(expectedQuery.value)
  }

  getSpanControls (query: SpanQuery<TestSpanControl>): TestSpanControl | null {
    if (query instanceof TestSpanQuery && query.value === this.expectedQuery.value) {
      return this.returnedControls
    }
    return null
  }
}

describe('CompositeSpanControlProvider', () => {
  describe('getSpanControls', () => {
    it('returns a span control when a matching provider is found', () => {
      const provider = new CompositeSpanControlProvider()
      const testProvider = new TestSpanControlProvider(new TestSpanQuery('test'), new TestSpanControl('value'))
      provider.addProvider(testProvider, 1)
      const result = provider.getSpanControls(new TestSpanQuery('test'))
      expect(result).toBeInstanceOf(TestSpanControl)
      expect(result?.value).toBe('value')
    })

    it('returns null when no matching providers are found', () => {
      const provider = new CompositeSpanControlProvider()
      const testProvider = new TestSpanControlProvider(new TestSpanQuery('test'), new TestSpanControl('value'))

      provider.addProvider(testProvider, 1)

      const result = provider.getSpanControls(new UnsupportedSpanQuery('test'))
      expect(result).toBeNull()
    })

    it('queries providers in priority order', () => {
      const lowPriorityProvider = new TestSpanControlProvider(new TestSpanQuery('test'), new TestSpanControl('low'))
      const mediumPriorityProvider = new TestSpanControlProvider(new TestSpanQuery('test'), new TestSpanControl('medium'))
      const highPriorityProvider = new TestSpanControlProvider(new TestSpanQuery('test'), new TestSpanControl('high'))

      const provider = new CompositeSpanControlProvider()
      provider.addProvider(lowPriorityProvider, 1)
      provider.addProvider(mediumPriorityProvider, 2)
      provider.addProvider(highPriorityProvider, 3)

      const result = provider.getSpanControls(new TestSpanQuery('test'))
      expect(result).toBeInstanceOf(TestSpanControl)
      expect(result?.value).toBe('high')
    })

    it('returns first non-null result', () => {
      const provider = new CompositeSpanControlProvider()

      provider.addProvider(new TestSpanControlProvider(new TestSpanQuery(null)), 3)
      provider.addProvider(new TestSpanControlProvider(new TestSpanQuery('test'), new TestSpanControl('first')), 2)
      provider.addProvider(new TestSpanControlProvider(new TestSpanQuery('test'), new TestSpanControl('second')), 1)

      const result = provider.getSpanControls(new TestSpanQuery('test'))
      expect(result?.value).toBe('first')
    })

    it('returns null when there are no providers', () => {
      const provider = new CompositeSpanControlProvider()
      const result = provider.getSpanControls(new TestSpanQuery('test'))
      expect(result).toBeNull()
    })

    it('returns null if all providers return null', () => {
      const provider = new CompositeSpanControlProvider()

      provider.addProvider(new TestSpanControlProvider(new TestSpanQuery(null)), 3)
      provider.addProvider(new TestSpanControlProvider(new TestSpanQuery(null)), 2)
      provider.addProvider(new TestSpanControlProvider(new TestSpanQuery(null)), 1)

      expect(provider.getSpanControls(new TestSpanQuery('high'))).toBeNull()
    })

    it('allows adding providers with same priority', () => {
      const provider = new CompositeSpanControlProvider()

      provider.addProvider(new TestSpanControlProvider(new TestSpanQuery('test'), new TestSpanControl('first')), 1)
      provider.addProvider(new TestSpanControlProvider(new TestSpanQuery('test'), new TestSpanControl('second')), 1)

      // First provider added should be queried first
      const result = provider.getSpanControls(new TestSpanQuery('test'))
      expect(result?.value).toBe('first')
    })

    it('ignores duplicate provider additions', () => {
      const provider = new CompositeSpanControlProvider()
      const testProvider = new TestSpanControlProvider(new TestSpanQuery('test'), new TestSpanControl('first'))

      provider.addProvider(testProvider, 1)
      provider.addProvider(testProvider, 2)

      // @ts-expect-error provider.items is private
      expect(provider.providers.items.length).toBe(1)
      // @ts-expect-error provider.items is private
      expect(provider.providers.items[0].priority).toBe(1)

      const result = provider.getSpanControls(new TestSpanQuery('test'))
      expect(result?.value).toBe('first')
    })
  })
})
