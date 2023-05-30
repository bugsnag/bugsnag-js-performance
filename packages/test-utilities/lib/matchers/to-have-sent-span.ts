import { expect } from '@jest/globals'
import { type MatcherFunction } from 'expect'
import { type DeliverySpan } from '@bugsnag/core-performance'
import { InMemoryDelivery } from '..'

const toHaveSentSpan: MatcherFunction<[expectedSpan: unknown]> = function (delivery, expectedSpan) {
  if (!(delivery instanceof InMemoryDelivery)) {
    throw new Error(`Expected an InMemoryDelivery instance, got ${this.utils.stringify(delivery)}`)
  }

  // pass if any span matches the expectedSpan; we explicitly don't care about order
  const pass = delivery.requests.some(payload => this.equals(payload, expect.objectContaining({
    resourceSpans: expect.arrayContaining([
      expect.objectContaining({
        scopeSpans: expect.arrayContaining([
          expect.objectContaining({
            spans: expect.arrayContaining([
              expectedSpan
            ])
          })
        ])
      })
    ])
  })))

  // print an empty array if there are no spans, otherwise print each span on its own line
  const actual = delivery.requests.length === 0
    ? this.utils.RECEIVED_COLOR('[]')
    : this.utils.RECEIVED_COLOR('[\n    ') +
      delivery.requests.map(payload => payload.resourceSpans.flatMap(({ scopeSpans }) => scopeSpans.flatMap(({ spans }) => spans.flatMap(({ attributes, ...rest }) => this.utils.printReceived({ ...rest })).join(',\n    ')))).join(',\n    ') +
      this.utils.RECEIVED_COLOR('\n]')

  const message = () =>
    this.utils.matcherHint('toHaveSentSpan', undefined, undefined, { isNot: this.isNot, promise: this.promise }) +
    '\n\n' +
    `Expected: ${pass ? 'not ' : ''}${this.utils.printExpected(expectedSpan)}\n` +
    `Received: ${actual}`

  return { actual: delivery.requests, message, pass }
}

expect.extend({
  toHaveSentSpan
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface AsymmetricMatchers {
      toHaveSentSpan: (span: Partial<DeliverySpan>) => void
    }

    interface Matchers<R> {
      toHaveSentSpan: (span: Partial<DeliverySpan>) => R
    }
  }
}
