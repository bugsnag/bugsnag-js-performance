import { type PerformanceEntryFake } from './performance-entry'
import PerformanceEntryListFake from './performance-entry-list'

// NOTE: this is intentionally a subset of the real Performance APIs because
//       they are fairly large and we don't (currently) need more than what's
//       here

export interface PerformanceTimingFake {
  responseStart: number
  navigationStart: number
  loadEventEnd: number
}

export interface PerformanceFakeOptions {
  timing?: Partial<PerformanceTimingFake>
  timeOrigin?: number
  undefinedTimeOrigin?: boolean
}

export class PerformanceFake extends PerformanceEntryListFake {
  public readonly timing: PerformanceTimingFake
  public readonly timeOrigin?: number

  constructor (options: PerformanceFakeOptions = {}) {
    super([])

    // use 'jest.now' as the default for both timeOrigin and navigationStart
    // so that 'advanceTimerByTime' & friends work as expected
    // advanceTimerByTime will still work as 'now' also uses 'jest.now'
    // https://jestjs.io/docs/jest-object#jestnow
    this.timing = {
      responseStart: 0,
      navigationStart: jest.now(),
      loadEventEnd: 0,
      ...(options.timing || {})
    }

    // in most cases we don't want to have to provide a timeOrigin as an option
    // but we need to also allow explicitly setting timeOrigin as undefined (true on Safari <15)
    this.timeOrigin = options.timeOrigin === undefined && !options.undefinedTimeOrigin
      ? jest.now()
      : options.timeOrigin
  }

  // NON SPEC

  addEntry (entry: PerformanceEntryFake) {
    this.entries.push(entry)
  }

  addEntries (...entries: PerformanceEntryFake[]) {
    this.entries.push(...entries)
  }

  // SPEC

  now () {
    const timeOrigin = this.timeOrigin === undefined
      ? this.timing.navigationStart
      : this.timeOrigin

    // use 'jest.now' so that 'advanceTimerByTime' & friends work as expected
    return jest.now() - timeOrigin
  }
}
