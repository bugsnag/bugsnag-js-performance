import type { Clock } from '../../lib/clock'

class IncrementingClock implements Clock {
  private currentTime: number
  private readonly timeOrigin: number

  constructor (startDate?: string) {
    this.currentTime = 0
    this.timeOrigin = startDate ? Date.parse(startDate) : Date.now()
  }

  now () {
    return ++this.currentTime
  }

  convert (date: Date) {
    return (date.getTime() - this.timeOrigin) * 1_000_000
  }
}

export default IncrementingClock
