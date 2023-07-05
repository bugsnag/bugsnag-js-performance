import {
  type SpanEnded,
  type ScaledProbability,
  SpanAttributes,
  traceIdToSamplingRate,
  SpanEvents
} from '@bugsnag/core-performance'
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
    samplingProbability: {
      raw: 0.5,
      scaled: Math.floor(0.5 * 0xffffffff) as ScaledProbability
    },
    ...overrides
  }
}
