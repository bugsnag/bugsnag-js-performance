import { type Delivery } from './delivery'
import { type SpanEnded, type SpanProbability } from './span'

// sampling rates are stored as a number between 0 and 2^32 - 1 (i.e. they are
// u32s) so we need to scale the probability value to match this range as they
// are stored as values between 0 and 1
function scaleProbabilityToMatchSamplingRate (probability: number): SpanProbability {
  return Math.floor(probability * 0xffffffff) as SpanProbability
}

class Sampler {
  private _probability: number
  private delivery?: Delivery

  /**
   * The current probability scaled to match sampling rate
   *
   * @see scaleProbabilityToMatchSamplingRate
   */
  private scaledProbability: SpanProbability

  constructor (initialProbability: number) {
    // we could just do 'this.probability = initialProbability' but TypeScript
    // doesn't like that as it doesn't directly initialise these properties in
    // the constructor
    this._probability = initialProbability
    this.scaledProbability = scaleProbabilityToMatchSamplingRate(initialProbability)
  }

  /**
   * The global probability value: a number between 0 & 1
   */
  get probability (): number {
    return this._probability
  }

  set probability (probability: number) {
    this._probability = probability
    this.scaledProbability = scaleProbabilityToMatchSamplingRate(probability)
  }

  /**
   * The probability value for spans: a number between 0 & 2^32 - 1
   *
   * This is necessary because span sampling rates are generated as unsigned 32
   * bit integers. We scale the global probability value to match that range, so
   * that we can use a simple calculation in 'sample'
   *
   * @see scaleProbabilityToMatchSamplingRate
   */
  get spanProbability (): SpanProbability {
    return this.scaledProbability
  }

  initialise (configuredProbability: number, delivery: Delivery) {
    this.probability = configuredProbability
    this.delivery = delivery

    // make initial sampling request
    this.fetchSamplingProbability()
  }

  async fetchSamplingProbability () {
    if (!this.delivery) return

    const payload = { resourceSpans: [] }
    const response = await this.delivery.send(payload)

    if (response.samplingProbability !== undefined) {
      this.probability = response.samplingProbability
    }
  }

  sample (span: SpanEnded): boolean {
    return span.samplingRate <= span.samplingProbability
  }
}

export default Sampler
