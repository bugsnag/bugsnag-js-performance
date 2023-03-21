import type { DeliveryPayload, Delivery } from '../../lib'

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
