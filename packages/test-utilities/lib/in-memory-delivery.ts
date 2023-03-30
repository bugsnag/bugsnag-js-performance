import { type DeliveryPayload, type Delivery, type ResponseState } from '@bugsnag/js-performance-core'

interface Request {
  apiKey: string
  endpoint: string
  payload: DeliveryPayload
}

class InMemoryDelivery implements Delivery {
  public requests: Request[] = []

  private readonly responseStateStack: ResponseState[] = []

  send (endpoint: string, apiKey: string, payload: DeliveryPayload) {
    this.requests.push({ apiKey, endpoint, payload })

    const state = this.responseStateStack.pop() || 'success' as ResponseState

    return Promise.resolve({ state })
  }

  setNextResponseState (state: ResponseState): void {
    this.responseStateStack.push(state)
  }
}

export default InMemoryDelivery
