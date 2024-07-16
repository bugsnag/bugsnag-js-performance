import { expect } from '@jest/globals'
import type { MatcherFunction } from 'expect'
import {

  SpanAttributes
} from '@bugsnag/core-performance'
import type { DeliverySpan, SpanInternal, SpanEnded, JsonAttribute } from '@bugsnag/core-performance'

function getValueObjectFor (value: unknown) {
  switch (typeof value) {
    case 'number':
      if (Number.isInteger(value)) {
        return { intValue: String(value) }
      }

      return { doubleValue: value }
    case 'boolean':
      return { boolValue: value }

    case 'string':
      return { stringValue: value }

    default:
      throw new Error(`Unexpected type of value: ${typeof value} (${value})`)
  }
}

function isDeliverySpan (span: unknown): span is DeliverySpan {
  return Array.isArray((span as any).attributes)
}

function hasSpanAttributes (span: unknown): span is SpanInternal | SpanEnded {
  return (span as any).attributes instanceof SpanAttributes
}

const toHaveAttribute: MatcherFunction<[name: string, value?: string | number | boolean]> = function (unknownSpan: unknown, key: string, value?: string | number | boolean) {
  const span = unknownSpan as DeliverySpan | SpanInternal | SpanEnded
  let attributes: JsonAttribute[]

  if (isDeliverySpan(span)) {
    attributes = (span as DeliverySpan).attributes.filter(Boolean) as JsonAttribute[]
  } else if (hasSpanAttributes(span)) {
    // cast to 'any' because 'attributes' is private in SpanInternal
    attributes = (span as any).attributes.toJson().filter(Boolean) as JsonAttribute[]
  } else {
    throw new Error(`Expected DeliverySpan, SpanInternal or SpanEnded, got: ${this.utils.stringify(span)}`)
  }

  const messageHeader = this.utils.matcherHint('toHaveAttribute', undefined, undefined, { isNot: this.isNot, promise: this.promise })

  // print an empty array if there are no attributes, otherwise print each attribute on its own line
  const actual = attributes.length === 0
    ? this.utils.RECEIVED_COLOR('[]')
    : this.utils.RECEIVED_COLOR('[\n    ') +
      attributes.map(attribute => this.utils.printReceived(attribute)).join(',\n    ') +
      this.utils.RECEIVED_COLOR('\n]')

  const matchingAttributes = attributes.filter(attribute => attribute && attribute.key === key)

  if (matchingAttributes.length === 1) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const attribute = matchingAttributes[0]!
    const expectedValue = getValueObjectFor(value)
    const pass = value === undefined || this.equals(attribute.value, expectedValue)

    const message = () =>
      messageHeader +
      '\n\n' +
      `Expected: ${pass ? 'no' : 'an'} attribute with key ${this.utils.printExpected(key)}` +
      (value ? ` and value ${this.utils.printExpected(expectedValue)}` : '') +
      `\nReceived: ${this.utils.printReceived(attribute)}`

    return { actual: matchingAttributes, message, pass }
  }

  // there is no attribute with the given key, there is more than 1 attribute
  // with the key or there are no attributes at all
  const pass = false

  const message = () =>
    messageHeader +
    '\n\n' +
    `Expected: ${pass ? 'no' : 'an'} attribute with key ${this.utils.printExpected(key)}` +
    (value ? ` and value ${this.utils.printExpected(value)}` : '') +
    `\nReceived: ${actual}`

  return { actual: attributes, message, pass }
}

expect.extend({
  toHaveAttribute
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface AsymmetricMatchers {
      toHaveAttribute: (key: string, value?: string | number | boolean) => void
    }

    interface Matchers<R> {
      toHaveAttribute: (key: string, value?: string | number | boolean) => R
    }
  }
}
