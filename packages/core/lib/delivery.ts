import type { JsonAttribute, ResourceAttributeSource } from './attributes'
import type { Clock } from './clock'
import type { Configuration, InternalConfiguration } from './config'
import type { JsonEvent } from './events'
import type { Kind, SpanEnded } from './span'
import { spanToJson } from './span'

export type DeliveryFactory = (endpoint: string, sendPayloadChecksums: boolean) => Delivery

export type ResponseState = 'success' | 'failure-discard' | 'failure-retryable'

interface Response {
  state: ResponseState
  samplingProbability?: number
}

export interface Delivery {
  send: (payload: TracePayload) => Promise<Response>
}

interface Resource {
  attributes: Array<JsonAttribute | undefined>
}

interface ScopeSpan {
  spans: DeliverySpan[]
}

interface ResourceSpan {
  resource: Resource
  scopeSpans: ScopeSpan[]
}

export interface DeliveryPayload {
  resourceSpans: ResourceSpan[]
}

export interface DeliverySpan {
  name: string
  kind: Kind
  spanId: string
  traceId: string
  parentSpanId?: string
  startTimeUnixNano: string
  endTimeUnixNano: string
  droppedAttributesCount?: number
  attributes: Array<JsonAttribute | undefined>
  events: JsonEvent[]
}

export interface TracePayload {
  body: DeliveryPayload
  headers: {
    'Bugsnag-Api-Key': string
    'Content-Type': 'application/json'
    // It may be unset if the SDK is being used with a fixed samplingProbability
    'Bugsnag-Span-Sampling'?: string
    // we don't add 'Bugsnag-Sent-At' in the TracePayloadEncoder so that retried
    // payloads get a new value each time delivery is attempted
    // therefore it's 'undefined' when passed to delivery, which adds a value
    // immediately before initiating the request
    'Bugsnag-Sent-At'?: string
    // 'undefined' when passed to delivery, which adds a value before initiating the request
    'Bugsnag-Integrity'?: string
  }
}

export class TracePayloadEncoder<C extends Configuration> {
  private readonly clock: Clock
  private readonly configuration: InternalConfiguration<C>
  private readonly resourceAttributeSource: ResourceAttributeSource<C>

  constructor (
    clock: Clock,
    configuration: InternalConfiguration<C>,
    resourceAttributeSource: ResourceAttributeSource<C>
  ) {
    this.clock = clock
    this.configuration = configuration
    this.resourceAttributeSource = resourceAttributeSource
  }

  async encode (spans: SpanEnded[]): Promise<TracePayload> {
    const resourceAttributes = await this.resourceAttributeSource(this.configuration)
    const jsonSpans = Array(spans.length)

    for (let i = 0; i < spans.length; ++i) {
      jsonSpans[i] = spanToJson(spans[i], this.clock)
    }

    const deliveryPayload: DeliveryPayload = {
      resourceSpans: [
        {
          resource: { attributes: resourceAttributes.toJson() },
          scopeSpans: [{ spans: jsonSpans }]
        }
      ]
    }

    return {
      body: deliveryPayload,
      headers: {
        'Bugsnag-Api-Key': this.configuration.apiKey,
        'Content-Type': 'application/json',
        // Do not set 'Bugsnag-Span-Sampling' if the SDK is configured with samplingProbability
        ...(this.configuration.samplingProbability !== undefined ? {} : { 'Bugsnag-Span-Sampling': this.generateSamplingHeader(spans) })
      }
    }
  }

  generateSamplingHeader (spans: SpanEnded[]): string {
    if (spans.length === 0) {
      return '1:0'
    }

    const spanCounts: Record<string, number> = Object.create(null)

    for (const span of spans) {
      const existingValue = spanCounts[span.samplingProbability.raw] || 0

      spanCounts[span.samplingProbability.raw] = existingValue + 1
    }

    const rawProbabilities = Object.keys(spanCounts)
    const pairs = Array(rawProbabilities.length)

    for (let i = 0; i < rawProbabilities.length; ++i) {
      const rawProbability = rawProbabilities[i]

      pairs[i] = `${rawProbability}:${spanCounts[rawProbability]}`
    }

    return pairs.join(';')
  }
}

const retryCodes = new Set([402, 407, 408, 429])

export function responseStateFromStatusCode (statusCode: number): ResponseState {
  if (statusCode >= 200 && statusCode < 300) {
    return 'success'
  }

  if (statusCode >= 400 && statusCode < 500 && !retryCodes.has(statusCode)) {
    return 'failure-discard'
  }

  return 'failure-retryable'
}
