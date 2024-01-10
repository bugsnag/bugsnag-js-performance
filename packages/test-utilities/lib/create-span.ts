import {
  SpanAttributes,
  SpanEvents,
  traceIdToSamplingRate,
  type ScaledProbability,
  type Span,
  type SpanEnded,
  type SpanProbability
} from '@bugsnag/core-performance'
import { randomBytes } from 'crypto'

export function createSamplingProbability (rawProbability: number): SpanProbability {
  return {
    raw: rawProbability,
    scaled: Math.floor(rawProbability * 0xffffffff) as ScaledProbability
  }
}

export function createSpan (name: string): Span {
  return {
    // @ts-expect-error added property for testing purposes
    name,
    id: 'test-id',
    traceId: 'test-trace-id',
    isValid: () => true,
    end: jest.fn()
  }
}

export function createEndedSpan (overrides: Partial<SpanEnded> = {}): SpanEnded {
  const traceId = overrides.traceId || randomBytes(16).toString('hex')

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
    samplingProbability: createSamplingProbability(1),
    ...overrides
  }
}
