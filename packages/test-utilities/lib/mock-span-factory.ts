import { type SpanEnded, type SpanInternal, SpanFactory } from '@bugsnag/js-performance-core'
import StableIdGenerator from './stable-id-generator'
import spanAttributesSource from './span-attributes-source'

class MockSpanFactory extends SpanFactory {
  createdSpans: SpanInternal[] = []

  constructor () {
    const delivery = { send: jest.fn() }
    const processor = { add: (span: SpanEnded) => delivery.send(span) }
    const sampler: any = { probability: 0.1, sample: () => true }
    super(processor, sampler, new StableIdGenerator(), spanAttributesSource)
  }

  startSpan = jest.fn((name: string, startTime: number) => {
    const span = super.startSpan(name, startTime)
    this.createdSpans.push(span)
    return span
  })

  endSpan = jest.fn((span: SpanInternal, endTime: number) => {
    super.endSpan(span, endTime)
  })
}

export default MockSpanFactory
