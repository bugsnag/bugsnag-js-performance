import PrioritizedSet from '../lib/prioritized-set'

describe('PrioritizedSet', () => {
  describe('constructor', () => {
    it('creates an empty set when no initial items are provided', () => {
      const set = new PrioritizedSet<string>()
      expect(Array.from(set)).toEqual([])
    })

    it('initializes with items in priority order', () => {
      const set = new PrioritizedSet<string>([
        { item: 'low', priority: 1 },
        { item: 'high', priority: 3 },
        { item: 'medium', priority: 2 }
      ])

      expect(Array.from(set)).toEqual(['high', 'medium', 'low'])
    })
  })

  describe('add', () => {
    it('adds a new item in priority order', () => {
      const set = new PrioritizedSet<string>()

      set.add('medium', 2)
      set.add('high', 3)
      set.add('low', 1)

      expect(Array.from(set)).toEqual(['high', 'medium', 'low'])
    })

    it('prevents duplicates', () => {
      const set = new PrioritizedSet<string>()

      expect(set.add('item', 1)).toBe(true)
      expect(Array.from(set)).toEqual(['item'])

      // Try to add the same item with different priority
      expect(set.add('item', 2)).toBe(false)
      expect(Array.from(set)).toEqual(['item'])
    })

    it('maintains priority order when adding items with same priority', () => {
      const set = new PrioritizedSet<string>()

      set.add('first', 1)
      set.add('second', 1)
      set.add('third', 1)

      // Items with same priority maintain insertion order
      expect(Array.from(set)).toEqual(['first', 'second', 'third'])
    })
  })

  describe('addAll', () => {
    it('adds multiple items with the same priority', () => {
      const set = new PrioritizedSet<string>()

      set.add('highest', 3)
      set.addAll([{ item: 'low1', priority: 1 }, { item: 'low2', priority: 1 }, { item: 'low3', priority: 1 }])
      set.add('medium', 2)

      expect(Array.from(set)).toEqual(['highest', 'medium', 'low1', 'low2', 'low3'])
    })

    it('skips duplicate items', () => {
      const set = new PrioritizedSet<string>()

      set.add('existing', 2)

      const result = set.addAll([{ item: 'new', priority: 1 }, { item: 'existing', priority: 1 }, { item: 'another', priority: 1 }])
      expect(result).toBe(true)

      expect(Array.from(set)).toEqual(['existing', 'new', 'another'])
    })

    it('returns false when no items were added', () => {
      const set = new PrioritizedSet<string>()

      set.add('existing', 2)

      const result = set.addAll([{ item: 'existing', priority: 1 }])
      expect(result).toBe(false)
      expect(Array.from(set)).toEqual(['existing'])
    })
  })

  describe('iteration', () => {
    it('allows iteration over items in priority order', () => {
      const set = new PrioritizedSet<string>([
        { item: 'low', priority: 1 },
        { item: 'high', priority: 3 },
        { item: 'medium', priority: 2 }
      ])

      const items: string[] = []
      for (const item of set) {
        items.push(item)
      }

      expect(items).toEqual(['high', 'medium', 'low'])
    })

    it('supports Array.from()', () => {
      const set = new PrioritizedSet<string>([
        { item: 'low', priority: 1 },
        { item: 'high', priority: 3 },
        { item: 'medium', priority: 2 }
      ])

      expect(Array.from(set)).toEqual(['high', 'medium', 'low'])
    })
  })
})
