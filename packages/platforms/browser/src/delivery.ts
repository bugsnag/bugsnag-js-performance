import type { DeliveryResult, TracePayload } from '@bugsnag/js-performance-core'

// TODO: Implement
export async function browserDelivery(tracePayload: TracePayload): Promise<DeliveryResult> {
  console.log("Payload being delivered...", tracePayload)
  return Promise.resolve({ success: true })
}

export default browserDelivery
