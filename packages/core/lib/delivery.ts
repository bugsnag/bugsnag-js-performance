import type { ResourceAttributes } from './attributes'
import type { SpanInternal } from './span'

export interface Delivery {
  send: (
    endpoint: string,
    apiKey: string,
    spans: SpanInternal[],
    resourceAtrributes: ResourceAttributes
  ) => Promise<Response> // this will become some kind of Response type when we capture p-values, for now we don't care
}
