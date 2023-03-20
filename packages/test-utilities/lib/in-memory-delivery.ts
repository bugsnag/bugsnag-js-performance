import { type DeliveryPayload, type Delivery } from '@bugsnag/js-performance-core'

interface Request {
  apiKey: string
  endpoint: string
  payload: DeliveryPayload
}

class InMemoryDelivery implements Delivery {
  public requests: Request[] = []

  send (endpoint: string, apiKey: string, payload: DeliveryPayload) {
    this.requests.push({ apiKey, endpoint, payload })
    return Promise.resolve()
  }
}

export default InMemoryDelivery
