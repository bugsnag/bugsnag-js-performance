import type { PerformanceEntryFake, PerformanceEntryType } from './performance-entry'

export default abstract class PerformanceEntryListFake {
  protected readonly entries: PerformanceEntryFake[]

  constructor (entries: PerformanceEntryFake[]) {
    this.entries = entries
  }

  getEntries (): PerformanceEntryFake[] {
    return this.entries
  }

  getEntriesByType (entryType: PerformanceEntryType): PerformanceEntryFake[] {
    return this.entries.filter(entry => entry.entryType === entryType)
  }

  getEntriesByName (name: string, entryType?: PerformanceEntryType): PerformanceEntryFake[] {
    return this.entries
      .filter(entry => entry.name === name && (
        entryType === undefined || entry.entryType === entryType
      ))
  }
}
