import type { Clock } from '@bugsnag/core-performance'

interface ClockOptions {
  startDate?: string
  currentTime?: number
}

const NANOSECONDS_IN_MILLISECONDS = 1_000_000

class IncrementingClock implements Clock {
  public readonly timeOrigin: number
  private currentTime: number

  constructor (options: string | ClockOptions = {}) {
    if (typeof options === 'string') {
      options = { startDate: options }
    }

    this.currentTime = options.currentTime || 0
    this.timeOrigin = options.startDate ? Date.parse(options.startDate) : Date.now()
  }

  now () {
    return ++this.currentTime
  }

  date () {
    return new Date(this.timeOrigin + this.now())
  }

  convert (date: Date) {
    return date.getTime() - this.timeOrigin
  }

  private _toUnixNanoseconds (time: number) {
    return ((this.timeOrigin + time) * NANOSECONDS_IN_MILLISECONDS)
  }

  toUnixTimestampNanoseconds (time: number) {
    return this._toUnixNanoseconds(time).toString()
  }

  fromUnixNanosecondsTimestamp (timestamp: string) {
    const nanos = parseInt(timestamp, 10)
    return (nanos / NANOSECONDS_IN_MILLISECONDS) - this.timeOrigin
  }
}

export default IncrementingClock
