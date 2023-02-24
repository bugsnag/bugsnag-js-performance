import type { JsonAttribute } from './attributes'

export interface Delivery {
  send: (
    endpoint: string,
    apiKey: string,
    payload: DeliveryPayload
  ) => Promise<void> // this will become some kind of Response type when we capture p-values, for now we don't care
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
  kind: 0 | 1 | 2 | 3 | 4 | 5
  spanId: string
  traceId: string
  startTimeUnixNano: number
  endTimeUnixNano: number
  attributes: Array<JsonAttribute | undefined>
}

export type Fetch = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>
