import { type Delivery, type DeliveryPayload } from './delivery'

export interface RetryQueue {
  add: (payload: DeliveryPayload) => void
  flush: () => Promise<void>
}

export class InMemoryQueue implements RetryQueue {
  private payloads: DeliveryPayload[] = []
  private requestQueue: Promise<void> = Promise.resolve()

  constructor (private delivery: Delivery, private retryQueueMaxSize: number) {}

  add (payload: DeliveryPayload) {
    this.payloads.push(payload)

    let spanCount = this.payloads.reduce((count, payload) => count + countSpansInPayload(payload), 0)

    while (spanCount > this.retryQueueMaxSize) {
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
          const { state } = await this.delivery.send(payload)

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
  let count = 0

  for (let i = 0; i < payload.resourceSpans.length; ++i) {
    const scopeSpans = payload.resourceSpans[i].scopeSpans

    for (let j = 0; j < scopeSpans.length; ++j) {
      count += scopeSpans[j].spans.length
    }
  }

  return count
}
