import { type SpanInternal, type SpanEnded, type SpanOptions, SpanFactory, DefaultSpanContextStorage } from '@bugsnag/core-performance'
import StableIdGenerator from './stable-id-generator'
import spanAttributesSource from './span-attributes-source'
import IncrementingClock from './incrementing-clock'
import InMemoryProcessor from './in-memory-processor'
import ControllableBackgroundingListener from './controllable-backgrounding-listener'

const jestLogger = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}

class MockSpanFactory extends SpanFactory {
  public createdSpans: SpanEnded[]

  constructor () {
    const sampler: any = { probability: 0.1, sample: () => true }
    const processor = new InMemoryProcessor()
    const backgroundingListener = new ControllableBackgroundingListener()

    super(
      processor,
      sampler,
      new StableIdGenerator(),
      spanAttributesSource,
      new IncrementingClock(),
      backgroundingListener,
      jestLogger,
      new DefaultSpanContextStorage(backgroundingListener)
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
