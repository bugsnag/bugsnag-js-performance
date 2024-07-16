import type { DeliveryPayload, Delivery, ResponseState, TracePayload } from '@bugsnag/core-performance'

class InMemoryDelivery implements Delivery {
  public requests: DeliveryPayload[] = []
  public samplingRequests: DeliveryPayload[] = []

  private readonly responseStateStack: ResponseState[] = []
  private readonly samplingProbabilityStack: Array<number | undefined> = []

  send (payload: TracePayload) {
    if (payload.body?.resourceSpans?.length === 0) {
      this.samplingRequests.push(payload.body)
    } else {
      this.requests.push(payload.body)
    }

    const state = this.responseStateStack.pop() || 'success' as ResponseState
    const samplingProbability = this.samplingProbabilityStack.length
      ? this.samplingProbabilityStack.pop()
      : 1.0

    return Promise.resolve({ state, samplingProbability })
  }

  setNextResponseState (state: ResponseState): void {
    this.responseStateStack.push(state)
  }

  setNextSamplingProbability (samplingProbability?: number): void {
    if (samplingProbability !== undefined && (samplingProbability < 0 || samplingProbability > 1)) {
      throw new Error(`Invalid sampling probability. Expected a number >= 0 && <= 1, got: ${samplingProbability}`)
    }

    this.samplingProbabilityStack.push(samplingProbability)
  }
}

export default InMemoryDelivery
