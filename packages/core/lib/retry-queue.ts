import type { Delivery, TracePayload } from './delivery'

export interface RetryQueue {
  add: (payload: TracePayload, time: number) => void
  flush: () => Promise<void>
}

export type RetryQueueFactory = (delivery: Delivery, retryQueueMaxSize: number) => RetryQueue

interface PayloadWithTimestamp {
  payload: TracePayload
  time: number
}

const msInDay = 24 * 60 * 60_000

export class InMemoryQueue implements RetryQueue {
  private requestQueue: Promise<void> = Promise.resolve()
  private payloads: PayloadWithTimestamp[] = []

  constructor (private delivery: Delivery, private retryQueueMaxSize: number) {}

  add (payload: TracePayload, time: number) {
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
      for (const { payload, time } of payloads) {
        // discard payloads at least 24 hours old
        if (Date.now() >= time + msInDay) continue

        try {
          const { state } = await this.delivery.send(payload)

          switch (state) {
            case 'success':
            case 'failure-discard':
              break
            case 'failure-retryable':
              this.add(payload, time)
              break
            default:
              state satisfies never
          }
        } catch (err) {}
      }
    })

    await this.requestQueue
  }
}

function countSpansInPayload (payload: TracePayload) {
  let count = 0

  for (let i = 0; i < payload.body.resourceSpans.length; ++i) {
    const scopeSpans = payload.body.resourceSpans[i].scopeSpans

    for (let j = 0; j < scopeSpans.length; ++j) {
      count += scopeSpans[j].spans.length
    }
  }

  return count
}
