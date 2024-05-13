import {
  DefaultSpanContextStorage,
  Sampler,
  type SpanAttribute,
  SpanFactory,
  type Configuration,
  type SpanEnded,
  type SpanInternal,
  type SpanOptions
} from '@bugsnag/core-performance'
import ControllableBackgroundingListener from './controllable-backgrounding-listener'
import InMemoryProcessor from './in-memory-processor'
import IncrementingClock from './incrementing-clock'
import spanAttributesSource from './span-attributes-source'
import StableIdGenerator from './stable-id-generator'

const jestLogger = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}

class MockSpanFactory <C extends Configuration> extends SpanFactory<C> {
  public createdSpans: SpanEnded[]

  constructor () {
    const processor = new InMemoryProcessor()
    const backgroundingListener = new ControllableBackgroundingListener()

    super(
      processor,
      new Sampler(1.0),
      new StableIdGenerator(),
      spanAttributesSource,
      new IncrementingClock(),
      backgroundingListener,
      jestLogger,
      new DefaultSpanContextStorage(backgroundingListener)
    )

    this.createdSpans = processor.spans
  }

  startSpan = jest.fn((name: string, options: SpanOptions) => {
    return super.startSpan(name, options)
  })

  endSpan = jest.fn((span: SpanInternal, endTime: number, additionalAttributes?: Record<string, SpanAttribute>) => {
    super.endSpan(span, endTime, additionalAttributes)
  })
}

export default MockSpanFactory
