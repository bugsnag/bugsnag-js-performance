import { type PerformanceEntryFake, type PerformanceEntryType } from './performance-entry'

// https://w3c.github.io/performance-timeline/#performanceobserverentrylist-interface
export default class PerformanceObserverEntryListFake {
  private entries: PerformanceEntryFake[]

  constructor (entries: PerformanceEntryFake[]) {
    this.entries = entries
  }

  getEntries (): PerformanceEntryFake[] {
    // duplicate the array so our internal copy can't be mutated
    return Array.from(this.entries)
  }

  getEntriesByName (name: string, type?: PerformanceEntryType): PerformanceEntryFake[] {
    return this.entries
      .filter(entry => entry.name === name)
      .filter(entry => type === undefined || entry.entryType === type)
  }

  getEntriesByType (type: PerformanceEntryType): PerformanceEntryFake[] {
    return this.entries.filter(entry => entry.entryType === type)
  }
}
