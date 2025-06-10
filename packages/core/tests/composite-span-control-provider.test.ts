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
  describe('addProvider', () => {
    it('adds a provider with specified priority', () => {
      const provider = new CompositeSpanControlProvider()
      const testProvider = new TestSpanControlProvider(new TestSpanQuery('test'))

      provider.addProvider(testProvider, 5)

      // @ts-expect-error provider.providers is private
      expect(provider.providers.items.length).toBe(1)
      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[0].item).toBe(testProvider)
      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[0].priority).toBe(5)
    })

    it('adds multiple providers with different priorities', () => {
      const provider = new CompositeSpanControlProvider()
      const lowProvider = new TestSpanControlProvider(new TestSpanQuery('low'))
      const highProvider = new TestSpanControlProvider(new TestSpanQuery('high'))

      provider.addProvider(lowProvider, 1)
      provider.addProvider(highProvider, 5)

      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[0]).toStrictEqual({ item: highProvider, priority: 5 })
      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[1]).toStrictEqual({ item: lowProvider, priority: 1 })
    })

    it('ignores duplicate providers', () => {
      const provider = new CompositeSpanControlProvider()
      const testProvider = new TestSpanControlProvider(new TestSpanQuery('test'))

      provider.addProvider(testProvider, 1)
      provider.addProvider(testProvider, 5)

      // @ts-expect-error provider.providers is private
      expect(provider.providers.items.length).toBe(1)
      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[0].priority).toBe(1)
    })

    it('allows providers with same priority', () => {
      const provider = new CompositeSpanControlProvider()
      const provider1 = new TestSpanControlProvider(new TestSpanQuery('test1'))
      const provider2 = new TestSpanControlProvider(new TestSpanQuery('test2'))

      provider.addProvider(provider1, 3)
      provider.addProvider(provider2, 3)

      // @ts-expect-error provider.providers is private
      expect(provider.providers.items.length).toBe(2)
      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[0]).toStrictEqual({ item: provider1, priority: 3 })
      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[1]).toStrictEqual({ item: provider2, priority: 3 })
    })
  })

  describe('addProviders', () => {
    it('adds multiple providers with their priorities', () => {
      const provider = new CompositeSpanControlProvider()
      const provider1 = new TestSpanControlProvider(new TestSpanQuery('test1'))
      const provider2 = new TestSpanControlProvider(new TestSpanQuery('test2'))
      const provider3 = new TestSpanControlProvider(new TestSpanQuery('test3'))

      provider.addProviders([
        { item: provider1, priority: 1 },
        { item: provider2, priority: 3 },
        { item: provider3, priority: 2 }
      ])

      // @ts-expect-error provider.providers is private
      expect(provider.providers.items.length).toBe(3)
      // Should be ordered by priority (highest first)
      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[0]).toStrictEqual({ item: provider2, priority: 3 })
      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[1]).toStrictEqual({ item: provider3, priority: 2 })
      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[2]).toStrictEqual({ item: provider1, priority: 1 })
    })

    it('handles empty array', () => {
      const provider = new CompositeSpanControlProvider()

      provider.addProviders([])

      // @ts-expect-error provider.providers is private
      expect(provider.providers.items.length).toBe(0)
    })

    it('ignores duplicate providers', () => {
      const provider = new CompositeSpanControlProvider()
      const testProvider = new TestSpanControlProvider(new TestSpanQuery('test'))

      provider.addProviders([
        { item: testProvider, priority: 1 },
        { item: testProvider, priority: 5 }
      ])

      // @ts-expect-error provider.providers is private
      expect(provider.providers.items.length).toBe(1)
      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[0].priority).toBe(1)
    })

    it('combines with existing providers correctly', () => {
      const provider = new CompositeSpanControlProvider()
      const existingProvider = new TestSpanControlProvider(new TestSpanQuery('existing'))
      const newProvider1 = new TestSpanControlProvider(new TestSpanQuery('new1'))
      const newProvider2 = new TestSpanControlProvider(new TestSpanQuery('new2'))

      provider.addProvider(existingProvider, 10)
      provider.addProviders([
        { item: newProvider1, priority: 5 },
        { item: newProvider2, priority: 15 }
      ])

      // @ts-expect-error provider.providers is private
      expect(provider.providers.items.length).toBe(3)
      // Should maintain priority order
      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[0]).toStrictEqual({ item: newProvider2, priority: 15 })
      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[1]).toStrictEqual({ item: existingProvider, priority: 10 })
      // @ts-expect-error provider.providers is private
      expect(provider.providers.items[2]).toStrictEqual({ item: newProvider1, priority: 5 })
    })
  })

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
  })
})
