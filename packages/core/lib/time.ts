import { type Clock } from './clock'
import { isNumber } from './validation'

export type Time = Date | number

export function timeToNumber (clock: Clock, time?: Time): number {
  if (isNumber(time)) {
    // no need to change anything - we want to store numbers anyway
    // we assume this is nanosecond precision
    return time
  }

  if (time instanceof Date) {
    return clock.convert(time)
  }

  return clock.now()
}
