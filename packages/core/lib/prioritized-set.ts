export interface Prioritized<T> {
  item: T
  priority: number
}

export const Priority = {
  LOW: 0,
  NORMAL: 10_000,
  HIGH: 100_000
}

export default class PrioritizedSet<T> {
  private items: Array<Prioritized<T>> = []

  constructor (initialItems?: Array<Prioritized<T>>) {
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

  addAll (items: Array<Prioritized<T>>): boolean {
    let added = false
    for (const item of items) {
      if (!this.items.some(i => i.item === item.item)) {
        this.items.push(item)
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
