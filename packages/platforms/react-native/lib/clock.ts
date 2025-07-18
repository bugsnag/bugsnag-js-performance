import type { Clock } from '@bugsnag/core-performance'
import { millisecondsToNanoseconds, nanosecondsToMilliseconds } from '@bugsnag/core-performance'

interface Performance {
  now: () => number
}

// Helper function to add two numbers represented as strings
const addStrings = (num1: string, num2: string): string => {
  let result = ''
  let carry = 0
  let i = num1.length - 1
  let j = num2.length - 1

  while (i >= 0 || j >= 0 || carry > 0) {
    const digit1 = i >= 0 ? parseInt(num1[i], 10) : 0
    const digit2 = j >= 0 ? parseInt(num2[j], 10) : 0
    const sum = digit1 + digit2 + carry

    result = (sum % 10) + result
    carry = Math.floor(sum / 10)

    i--
    j--
  }

  return result
}

const createClock = (performance: Performance): Clock => {
  // Measurable "monotonic" time
  // In React Native, `performance.now` often returns some very high values, but does not expose the `timeOrigin` it uses to calculate what "now" is.
  // by storing the value of `performance.now` when the app starts, we can remove that value from any further `.now` calculations, and add it to the current "wall time" to get a useful timestamp.
  const startPerfTime = performance.now()
  const startWallTime = Date.now()

  const toUnixNanoseconds = (time: number) => millisecondsToNanoseconds(time - startPerfTime + startWallTime)

  return {
    now: () => performance.now(),
    date: () => new Date(performance.now() - startPerfTime + startWallTime),
    convert: (date: Date) => date.getTime() - startWallTime + startPerfTime,
    toUnixNanoseconds,
    // convert unix time in nanoseconds back to milliseconds since timeOrigin
    fromUnixNanoseconds: (time: number) => nanosecondsToMilliseconds(time) - startWallTime + startPerfTime,
    // convert milliseconds since timeOrigin to full timestamp
    toUnixTimestampNanoseconds: (time: number) => {
      // Calculate the unix timestamp in milliseconds with high precision
      const unixMilliseconds = time - startPerfTime + startWallTime

      // Convert to string to preserve all precision from the input
      const unixMillisecondsStr = unixMilliseconds.toString()

      // Find the decimal point to split integer and fractional parts
      const decimalIndex = unixMillisecondsStr.indexOf('.')

      let integerMsStr: string
      let fractionalMsStr: string

      if (decimalIndex === -1) {
        // No decimal point, all integer
        integerMsStr = unixMillisecondsStr
        fractionalMsStr = '0'
      } else {
        // Split at decimal point
        integerMsStr = unixMillisecondsStr.substring(0, decimalIndex)
        fractionalMsStr = unixMillisecondsStr.substring(decimalIndex + 1)
      }

      // Convert integer milliseconds to nanoseconds (append 6 zeros)
      let result = integerMsStr === '0' ? '0' : integerMsStr + '000000'

      // Convert fractional milliseconds to nanoseconds
      if (fractionalMsStr !== '0') {
        // Pad or truncate fractional part to 6 digits (microsecond precision)
        // since 1 ms = 1,000,000 ns, the fractional part needs to be scaled
        if (fractionalMsStr.length > 6) {
          fractionalMsStr = fractionalMsStr.substring(0, 6)
        } else {
          fractionalMsStr = fractionalMsStr.padEnd(6, '0')
        }

        // Add the fractional nanoseconds
        result = addStrings(result, fractionalMsStr)
      }

      return result
    }
  }
}

export default createClock
