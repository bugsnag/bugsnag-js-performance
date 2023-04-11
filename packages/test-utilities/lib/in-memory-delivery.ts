import { type DeliveryPayload, type Delivery, type ResponseState } from '@bugsnag/js-performance-core'

class InMemoryDelivery implements Delivery {
  public requests: DeliveryPayload[] = []

  private readonly responseStateStack: ResponseState[] = []

  send (payload: DeliveryPayload) {
    this.requests.push(payload)

    const state = this.responseStateStack.pop() || 'success' as ResponseState

    return Promise.resolve({ state })
  }

  setNextResponseState (state: ResponseState): void {
    this.responseStateStack.push(state)
  }
}

export default InMemoryDelivery
