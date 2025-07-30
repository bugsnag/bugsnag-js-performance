import type { Clock } from '@bugsnag/core-performance'

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

// Helper function to subtract two numbers represented as strings (num1 - num2)
const subtractStrings = (num1: string, num2: string): string => {
  // Ensure num1 >= num2 for simplicity
  if (num1.length < num2.length || (num1.length === num2.length && num1 < num2)) {
    throw new Error('Cannot subtract larger number from smaller number')
  }

  let result = ''
  let borrow = 0
  let i = num1.length - 1
  let j = num2.length - 1

  while (i >= 0) {
    const digit1 = parseInt(num1[i], 10) - borrow
    const digit2 = j >= 0 ? parseInt(num2[j], 10) : 0

    if (digit1 >= digit2) {
      result = (digit1 - digit2) + result
      borrow = 0
    } else {
      result = (digit1 + 10 - digit2) + result
      borrow = 1
    }

    i--
    j--
  }

  // Remove leading zeros
  return result.replace(/^0+/, '') || '0'
}

// Helper function to handle decimal arithmetic with strings
const subtractDecimalStrings = (num1Str: string, num2Str: string): string => {
  // Parse decimal numbers
  const [int1, frac1 = ''] = num1Str.split('.')
  const [int2, frac2 = ''] = num2Str.split('.')

  // Pad fractional parts to same length
  const maxFracLen = Math.max(frac1.length, frac2.length)
  const padded1 = frac1.padEnd(maxFracLen, '0')
  const padded2 = frac2.padEnd(maxFracLen, '0')

  // Combine integer and fractional parts
  const combined1 = int1 + padded1
  const combined2 = int2 + padded2

  // Subtract
  const resultCombined = subtractStrings(combined1, combined2)

  // Split back into integer and fractional parts
  if (maxFracLen === 0) {
    return resultCombined
  }

  const resultInt = resultCombined.slice(0, -maxFracLen) || '0'
  const resultFrac = resultCombined.slice(-maxFracLen).replace(/0+$/, '')

  return resultFrac ? `${resultInt}.${resultFrac}` : resultInt
}

const addDecimalStrings = (num1Str: string, num2Str: string): string => {
  // Parse decimal numbers
  const [int1, frac1 = ''] = num1Str.split('.')
  const [int2, frac2 = ''] = num2Str.split('.')

  // Pad fractional parts to same length
  const maxFracLen = Math.max(frac1.length, frac2.length)
  const padded1 = frac1.padEnd(maxFracLen, '0')
  const padded2 = frac2.padEnd(maxFracLen, '0')

  // Combine integer and fractional parts
  const combined1 = int1 + padded1
  const combined2 = int2 + padded2

  // Add
  const resultCombined = addStrings(combined1, combined2)

  // Split back into integer and fractional parts
  if (maxFracLen === 0) {
    return resultCombined
  }

  const resultInt = resultCombined.slice(0, -maxFracLen) || '0'
  const resultFrac = resultCombined.slice(-maxFracLen).replace(/0+$/, '')

  return resultFrac ? `${resultInt}.${resultFrac}` : resultInt
}

const createClock = (performance: Performance): Clock => {
  // Measurable "monotonic" time
  // In React Native, `performance.now` often returns some very high values, but does not expose the `timeOrigin` it uses to calculate what "now" is.
  // by storing the value of `performance.now` when the app starts, we can remove that value from any further `.now` calculations, and add it to the current "wall time" to get a useful timestamp.
  const startPerfTime = performance.now()
  const startWallTime = Date.now()

  return {
    now: () => performance.now(),
    date: () => new Date(performance.now() - startPerfTime + startWallTime),
    convert: (date: Date) => date.getTime() - startWallTime + startPerfTime,
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
    },
    // convert unix timestamp in nanoseconds (string) back to milliseconds since timeOrigin
    fromUnixNanosecondsTimestamp: (nanosStr: string) => {
      // Convert nanoseconds string to milliseconds string with full precision
      let millisecondsStr: string

      if (nanosStr.length <= 6) {
        // Less than 1 millisecond - create fractional milliseconds
        const paddedNanos = nanosStr.padStart(6, '0')
        millisecondsStr = '0.' + paddedNanos
      } else {
        // Split nanoseconds into milliseconds and fractional nanoseconds
        const msLength = nanosStr.length - 6
        const integerMs = nanosStr.substring(0, msLength)
        const fractionalNs = nanosStr.substring(msLength)

        if (fractionalNs === '000000') {
          millisecondsStr = integerMs
        } else {
          // Remove trailing zeros from fractional part
          const trimmedFractional = fractionalNs.replace(/0+$/, '')
          millisecondsStr = integerMs + '.' + trimmedFractional
        }
      }

      // Perform calculation using string arithmetic to maintain precision
      // unixMilliseconds - startWallTime + startPerfTime
      const startWallTimeStr = startWallTime.toString()
      const startPerfTimeStr = startPerfTime.toString()

      // Step 1: unixMilliseconds - startWallTime
      const afterSubtraction = subtractDecimalStrings(millisecondsStr, startWallTimeStr)

      // Step 2: result + startPerfTime
      const finalResult = addDecimalStrings(afterSubtraction, startPerfTimeStr)

      // Convert to number only at the very end
      return parseFloat(finalResult)
    }
  }
}

export default createClock
