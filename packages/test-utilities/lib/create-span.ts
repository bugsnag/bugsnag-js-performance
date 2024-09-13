import {
  SpanAttributes,
  SpanEvents,
  traceIdToSamplingRate

} from '@bugsnag/core-performance'
import type { ScaledProbability, SpanEnded, SpanProbability } from '@bugsnag/core-performance'
import { randomBytes } from 'crypto'

export function createSamplingProbability (rawProbability: number): SpanProbability {
  return {
    raw: rawProbability,
    scaled: Math.floor(rawProbability * 0xffffffff) as ScaledProbability
  }
}

export function createEndedSpan (overrides: Partial<SpanEnded> = {}): SpanEnded {
  const traceId = overrides.traceId || randomBytes(16).toString('hex')

  const defaultAttributes = new SpanAttributes(new Map())

  return {
    attributes: defaultAttributes,
    events: new SpanEvents(),
    id: randomBytes(8).toString('hex'),
    name: 'test span',
    kind: 1,
    startTime: 12345,
    traceId,
    samplingRate: traceIdToSamplingRate(traceId),
    endTime: 23456,
    samplingProbability: createSamplingProbability(1),
    setAttribute: defaultAttributes.set,
    ...overrides
  }
}
