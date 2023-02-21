import type { JsonAttribute } from './attributes'

export interface Delivery {
  send: (
    endpoint: string,
    apiKey: string,
    payload: DeliveryPayload
  ) => Promise<void> // this will become some kind of Response type when we capture p-values, for now we don't care
}

interface Resource {
  attributes: JsonAttribute[]
}

interface ScopeSpan {
  spans: JsonAttribute[]
}

interface ResourceSpan {
  resource: Resource
  scopeSpans: ScopeSpan[]
}

export interface DeliveryPayload {
  resourceSpans: ResourceSpan[]
}
