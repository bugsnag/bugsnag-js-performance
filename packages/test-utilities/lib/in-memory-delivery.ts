import { type DeliveryPayload, type Delivery, type ResponseState } from '@bugsnag/core-performance'

class InMemoryDelivery implements Delivery {
  public requests: DeliveryPayload[] = []
  public samplingRequests: DeliveryPayload[] = []

  private readonly responseStateStack: ResponseState[] = []
  private readonly samplingProbabilityStack: Array<number | undefined> = []

  send (payload: DeliveryPayload) {
    if (payload.resourceSpans.length === 0) {
      this.samplingRequests.push(payload)
    } else {
      this.requests.push(payload)
    }

    const state = this.responseStateStack.pop() || 'success' as ResponseState
    const samplingProbability = this.samplingProbabilityStack.pop()

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
