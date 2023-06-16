import { type JsonAttribute } from './attributes'
import { type JsonEvent } from './events'
import { type Kind } from './span'

export type DeliveryFactory = (apiKey: string, endpoint: string) => Delivery

export type ResponseState = 'success' | 'failure-discard' | 'failure-retryable'

interface Response {
  state: ResponseState
  samplingProbability?: number
}

export interface Delivery {
  send: (payload: DeliveryPayload) => Promise<Response>
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
  attributes: Array<JsonAttribute | undefined>
  events: JsonEvent[]
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
