import { type Delivery } from './delivery'

// the time to wait before retrying a failed request
const RETRY_MILLISECONDS = 30 * 1000

// the request body sent when fetching a new probability value; this is the
// minimal body the server expects to receive
const PROBABILITY_REQUEST = { resourceSpans: [] }

class ProbabilityFetcher {
  private readonly delivery: Delivery

  constructor (delivery: Delivery) {
    this.delivery = delivery
  }

  async getNewProbability (): Promise<number> {
    // keep making requests until we get a new probability value from the server
    while (true) {
      const response = await this.delivery.send(PROBABILITY_REQUEST)

      // in theory this should always be present, but it's possible the request
      // fails or there's a bug on the server side causing it not to be returned
      if (response.samplingProbability !== undefined) {
        return response.samplingProbability
      }

      await this.timeBetweenRetries()
    }
  }

  private timeBetweenRetries (): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, RETRY_MILLISECONDS)
    })
  }
}

export default ProbabilityFetcher
