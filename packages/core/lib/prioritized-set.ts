export default class PrioritizedSet<T> {
  private items: Array<{ item: T, priority: number }> = []

  constructor (initialItems?: Array<{ item: T, priority: number }>) {
    if (initialItems) {
      this.items = initialItems
      this.sort()
    }
  }

  add (item: T, priority: number): boolean {
    if (this.items.some(i => i.item === item)) {
      return false
    }

    this.items.push({ item, priority })
    this.sort()
    return true
  }

  addAll (items: T[], priority: number): boolean {
    let added = false
    for (const item of items) {
      if (!this.items.some(i => i.item === item)) {
        this.items.push({ item, priority })
        added = true
      }
    }

    if (added) {
      this.sort()
    }

    return added
  }

  * [Symbol.iterator] (): Iterator<T> {
    for (const item of this.items) {
      yield item.item
    }
  }

  private sort (): void {
    this.items.sort((a, b) => b.priority - a.priority)
  }
}
