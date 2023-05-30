import { type Clock } from '@bugsnag/core-performance'

interface ClockOptions {
  startDate?: string
  currentTime?: number
}

class IncrementingClock implements Clock {
  private currentTime: number
  private readonly timeOrigin: number

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

  convert (date: Date) {
    return date.getTime() - this.timeOrigin
  }

  toUnixTimestampNanoseconds (time: number) {
    return ((this.timeOrigin + time) * 1_000_000).toString()
  }
}

export default IncrementingClock
