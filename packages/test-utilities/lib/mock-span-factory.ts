import { type SpanInternal, type SpanEnded, type SpanOptions, SpanFactory } from '@bugsnag/core-performance'
import StableIdGenerator from './stable-id-generator'
import spanAttributesSource from './span-attributes-source'
import IncrementingClock from './incrementing-clock'
import InMemoryProcessor from './in-memory-processor'
import ControllableBackgroundingListener from './controllable-backgrounding-listener'

class MockSpanFactory extends SpanFactory {
  public createdSpans: SpanEnded[]

  constructor () {
    const sampler: any = { probability: 0.1, sample: () => true }
    const processor = new InMemoryProcessor()

    super(
      processor,
      sampler,
      new StableIdGenerator(),
      spanAttributesSource,
      new IncrementingClock(),
      new ControllableBackgroundingListener()
    )

    this.createdSpans = processor.spans
  }

  startSpan = jest.fn((name: string, options?: SpanOptions) => {
    return super.startSpan(name, options)
  })

  endSpan = jest.fn((span: SpanInternal, endTime: number) => {
    super.endSpan(span, endTime)
  })
}

export default MockSpanFactory
