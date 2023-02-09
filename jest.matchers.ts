import { expect } from '@jest/globals'
import type { MatcherFunction } from 'expect'
import type { SpanInternal } from './packages/core/lib/span'
import { InMemoryProcessor } from './packages/core/tests/utilities'

const toHaveProcessedSpan: MatcherFunction<[expectedSpan: unknown]> = function (processor, expectedSpan) {
  if (!(processor instanceof InMemoryProcessor)) {
    throw new Error(`Expected an InMemoryProcessor instance, got ${this.utils.stringify(processor)}`)
  }

  // pass if any span matches the expectedSpan; we explicitly don't care about order
  const pass = processor.spans.some(span => this.equals(span, expectedSpan))

  // print an empty array if there are no spans, otherwise print each span on its own line
  const actual = processor.spans.length === 0
    ? this.utils.RECEIVED_COLOR('[]')
    : this.utils.RECEIVED_COLOR('[\n    ') +
      processor.spans.map(span => this.utils.printReceived(span)).join(',\n    ') +
      this.utils.RECEIVED_COLOR(',\n]')

  const message = () =>
    this.utils.matcherHint('toHaveProcessedSpan', undefined, undefined, { isNot: this.isNot, promise: this.promise }) +
    '\n\n' +
    `Expected: ${pass ? 'not ' : ''}${this.utils.printExpected(expectedSpan)}\n` +
    `Received: ${actual}`

  return { actual: processor.spans, message, pass }
}

expect.extend({
  toHaveProcessedSpan
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface AsymmetricMatchers {
      toHaveProcessedSpan: (span: SpanInternal) => void
    }

    interface Matchers<R> {
      toHaveProcessedSpan: (span: SpanInternal) => R
    }
  }
}
