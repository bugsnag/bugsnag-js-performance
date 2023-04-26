import {
  type SpanEnded,
  type SpanProbability,
  SpanAttributes,
  traceIdToSamplingRate,
  SpanEvents
} from '@bugsnag/js-performance-core'
import { randomBytes } from 'crypto'

export function createEndedSpan (overrides: Partial<SpanEnded> = {}): SpanEnded {
  const traceId = randomBytes(16).toString()

  return {
    attributes: new SpanAttributes(new Map()),
    events: new SpanEvents(),
    id: randomBytes(8).toString('hex'),
    name: 'test span',
    kind: 1,
    startTime: 12345,
    traceId,
    samplingRate: traceIdToSamplingRate(traceId),
    endTime: 23456,
    samplingProbability: Math.floor(0.5 * 0xffffffff) as SpanProbability,
    ...overrides
  }
}
