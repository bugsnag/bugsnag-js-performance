import { type Delivery, type DeliveryPayload } from './delivery'

const MAX_SPANS_IN_QUEUE = 1000

export interface RetryQueue {
  add: (payload: DeliveryPayload) => void
  flush: () => void
}

export default class InMemoryQueue implements RetryQueue {
  private payloads: DeliveryPayload[] = []

  constructor (private delivery: Delivery, private endpoint: string, private apiKey: string) {}

  add (payload: DeliveryPayload) {
    this.payloads.push(payload)

    let spanCount = this.payloads.reduce((count, payload) => count + countSpansInPayload(payload), 0)

    while (spanCount > MAX_SPANS_IN_QUEUE) {
      const payload = this.payloads.shift()

      if (!payload) {
        break
      }

      spanCount -= countSpansInPayload(payload)
    }
  }

  flush () {
    for (const payload of this.payloads) {
      this.delivery.send(this.endpoint, this.apiKey, payload)
    }
  }
}

export function countSpansInPayload (payload: DeliveryPayload) {
  return payload.resourceSpans.flatMap(({ scopeSpans }) => scopeSpans.flatMap(({ spans }) => spans)).length
}
