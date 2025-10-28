import type { Configuration, SpanAttributesSource } from '@bugsnag/core-performance'

const spanAttributesSource: SpanAttributesSource<Configuration> = {
  configure: jest.fn(),
  requestAttributes: jest.fn()
}

export default spanAttributesSource
