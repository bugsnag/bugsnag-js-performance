import {
  DefaultSpanContextStorage,
  Sampler,
  SpanFactory
} from '@bugsnag/core-performance'
import type { SpanAttribute, Configuration, SpanEnded, SpanInternal, SpanOptions } from '@bugsnag/core-performance'
import ControllableBackgroundingListener from './controllable-backgrounding-listener'
import InMemoryProcessor from './in-memory-processor'
import IncrementingClock from './incrementing-clock'
import spanAttributesSource from './span-attributes-source'
import StableIdGenerator from './stable-id-generator'
import { ReactNativeSpanFactory } from '@bugsnag/react-native-performance/lib/span-factory'

const jestLogger = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}

const defaultOptions = () => {
  const backgroundingListener = new ControllableBackgroundingListener()

  return {
    processor: new InMemoryProcessor(),
    sampler: new Sampler(1.0),
    idGenerator: new StableIdGenerator(),
    spanAttributesSource,
    clock: new IncrementingClock(),
    backgroundingListener,
    logger: jestLogger,
    spanContextStorage: new DefaultSpanContextStorage(backgroundingListener)
  }
}

class MockSpanFactory <C extends Configuration> extends SpanFactory<C> {
  public createdSpans: SpanEnded[]

  constructor (overrides: Partial<ReturnType<typeof defaultOptions>> = {}) {
    const options = { ...defaultOptions(), ...overrides }

    super(
      options.processor,
      options.sampler,
      options.idGenerator,
      options.spanAttributesSource,
      options.clock,
      options.backgroundingListener,
      options.logger,
      options.spanContextStorage
    )

    this.createdSpans = options.processor.spans
  }

  startSpan = jest.fn((name: string, options: SpanOptions) => {
    return super.startSpan(name, options)
  })

  endSpan = jest.fn((span: SpanInternal, endTime: number, additionalAttributes?: Record<string, SpanAttribute>) => {
    super.endSpan(span, endTime, additionalAttributes)
  })
}

class MockReactNativeSpanFactory extends ReactNativeSpanFactory {
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

  startNavigationSpan = jest.fn((name: string, options: SpanOptions) => {
    return super.startNavigationSpan(name, options)
  })

  reset () {
    this.startSpan.mockClear()
    this.endSpan.mockClear()
    this.startNavigationSpan.mockClear()

    const processor = new InMemoryProcessor()
    this.createdSpans = processor.spans
    // @ts-expect-error processor is private
    this.processor = processor

    // @ts-expect-error spanContextStorage is private
    this.spanContextStorage.contextStack.length = 0
  }
}

export { MockSpanFactory, MockReactNativeSpanFactory }
