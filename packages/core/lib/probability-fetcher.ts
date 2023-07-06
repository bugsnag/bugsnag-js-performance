import { type Delivery, type TracePayload } from './delivery'

// the time to wait before retrying a failed request
const RETRY_MILLISECONDS = 30 * 1000

class ProbabilityFetcher {
  private readonly delivery: Delivery
  private readonly payload: TracePayload

  constructor (delivery: Delivery, apiKey: string) {
    this.delivery = delivery
    this.payload = {
      body: { resourceSpans: [] },
      headers: {
        'Bugsnag-Api-Key': apiKey,
        'Content-Type': 'application/json',
        'Bugsnag-Span-Sampling': '1.0:0'
      }
    }
  }

  async getNewProbability (): Promise<number> {
    // keep making requests until we get a new probability value from the server
    while (true) {
      const response = await this.delivery.send(this.payload)

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
