import { type Delivery, type DeliveryPayload } from './delivery'

const MAX_SPANS_IN_QUEUE = 1000

export interface RetryQueue {
  add: (payload: DeliveryPayload) => void
  flush: () => Promise<void>
}

export default class InMemoryQueue implements RetryQueue {
  private payloads: DeliveryPayload[] = []
  private requestQueue: Promise<void> = Promise.resolve()

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

  async flush () {
    if (this.payloads.length === 0) return

    const payloads = this.payloads
    this.payloads = []

    this.requestQueue = this.requestQueue.then(async () => {
      for (const payload of payloads) {
        try {
          const { state } = await this.delivery.send(this.endpoint, this.apiKey, payload)

          switch (state) {
            case 'success':
            case 'failure-discard':
              break
            case 'failure-retryable':
              this.add(payload)
              break
            default: {
              const _exhaustiveCheck: never = state
              return _exhaustiveCheck
            }
          }
        } catch (err) {}
      }
    })

    await this.requestQueue
  }
}

function countSpansInPayload (payload: DeliveryPayload) {
  return payload.resourceSpans.flatMap(({ scopeSpans }) => scopeSpans.flatMap(({ spans }) => spans)).length
}
