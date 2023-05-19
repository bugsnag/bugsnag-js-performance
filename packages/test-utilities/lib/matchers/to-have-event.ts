import { expect } from '@jest/globals'
import { type MatcherFunction } from 'expect'
import { type DeliverySpan } from '@bugsnag/js-performance-core'

const toHaveEvent: MatcherFunction<[name: string, value?: string]> = function (unknownSpan: unknown, name: string, value?: string) {
  const span = unknownSpan as DeliverySpan
  const messageHeader = this.utils.matcherHint('toHaveEvent', undefined, undefined, { isNot: this.isNot, promise: this.promise })

  // print an empty array if there are no events, otherwise print each event on its own line
  const actual = span.events.length === 0
    ? this.utils.RECEIVED_COLOR('[]')
    : this.utils.RECEIVED_COLOR('[\n    ') +
      span.events.map(event => this.utils.printReceived(event)).join(',\n    ') +
      this.utils.RECEIVED_COLOR('\n]')

  const events = span.events.filter(event => event.name === name)

  if (events.length === 1) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const event = events[0]!
    const pass = value === undefined || event.timeUnixNano === value

    const message = () =>
      messageHeader +
      '\n\n' +
      `Expected: ${pass ? 'no' : 'an'} event named ${this.utils.printExpected(name)}` +
      (value ? ` with value ${this.utils.printExpected(value)}` : '') +
      `\nReceived: ${this.utils.printReceived(event)}`

    return { actual: span.events, message, pass }
  }

  // there is no event with the given key, there is more than 1 event with the
  // key or there are no events at all
  const pass = false

  const message = () =>
    messageHeader +
    '\n\n' +
    `Expected: ${pass ? 'no' : 'an'} event named ${this.utils.printExpected(name)}` +
    (value ? ` with value ${this.utils.printExpected(value)}` : '') +
    `\nReceived: ${actual}`

  return { actual: span.events, message, pass }
}

expect.extend({
  toHaveEvent
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface AsymmetricMatchers {
      toHaveEvent: (name: string, value?: string) => void
    }

    interface Matchers<R> {
      toHaveEvent: (name: string, value?: string) => R
    }
  }
}
