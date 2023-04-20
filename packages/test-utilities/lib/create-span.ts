import {
  type SpanEnded,
  type SpanInternal,
  SpanAttributes,
  traceIdToSamplingRate
} from '@bugsnag/js-performance-core'
import { randomBytes } from 'crypto'

export function createSpan (overrides: Partial<SpanInternal> = {}): SpanInternal {
  const traceId = randomBytes(16).toString()

  return {
    attributes: new SpanAttributes(new Map()),
    id: randomBytes(8).toString('hex'),
    name: 'test span',
    kind: 1,
    startTime: 12345,
    traceId,
    samplingRate: traceIdToSamplingRate(traceId),
    ...overrides
  }
}

export function createEndedSpan (overrides: Partial<SpanEnded> = {}): SpanEnded {
  return {
    ...createSpan(),
    endTime: 23456,
    samplingProbability: Math.floor(0.5 * 0xffffffff),
    ...overrides
  }
}
