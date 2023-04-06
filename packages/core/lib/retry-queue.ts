import { type Delivery, type DeliveryPayload } from './delivery'

export interface RetryQueue {
  add: (payload: DeliveryPayload, time: number) => void
  flush: () => Promise<void>
}

interface RetryPayload {
  time: number
  payload: DeliveryPayload
}

export class InMemoryQueue implements RetryQueue {
  private payloads: RetryPayload[] = []
  private requestQueue: Promise<void> = Promise.resolve()

  constructor (private delivery: Delivery, private endpoint: string, private apiKey: string, private retryQueueMaxSize: number) {}

  add (payload: DeliveryPayload, time: number) {
    this.payloads.push({ payload, time })

    let spanCount = this.payloads.reduce((count, { payload }) => count + countSpansInPayload(payload), 0)

    while (spanCount > this.retryQueueMaxSize) {
      const payload = this.payloads.shift()

      if (!payload) {
        break
      }

      spanCount -= countSpansInPayload(payload.payload)
    }
  }

  async flush () {
    if (this.payloads.length === 0) return

    const payloads = this.payloads
    this.payloads = []

    this.requestQueue = this.requestQueue.then(async () => {
      for (const payload of payloads) {
        // discard payloads at least 24 hours old
        if (new Date().getTime() >= payload.time + 24 * 60 * 60_000) continue

        try {
          const { state } = await this.delivery.send(this.endpoint, this.apiKey, payload.payload)

          switch (state) {
            case 'success':
            case 'failure-discard':
              break
            case 'failure-retryable':
              this.add(payload.payload, payload.time)
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
  let count = 0

  for (let i = 0; i < payload.resourceSpans.length; ++i) {
    const scopeSpans = payload.resourceSpans[i].scopeSpans

    for (let j = 0; j < scopeSpans.length; ++j) {
      count += scopeSpans[j].spans.length
    }
  }

  return count
}
