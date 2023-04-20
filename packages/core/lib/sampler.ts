// sampling rates are stored as a number between 0 and 0xffffffff (i.e. they are
// u32s) so we need to scale the probability value to match this range as they
// are stored as values between 0 and 1
function scaleProbabilityToMatchSamplingRate (probability: number): number {
  return Math.floor(probability * 0xffffffff)
}

class Sampler {
  private _probability: number

  /**
   * The current probability scaled to match sampling rate
   *
   * @see scaleProbabilityToMatchSamplingRate
   */
  private scaledProbability: number

  constructor (initialProbability: number) {
    // we could just do 'this.probability = initialProbability' but TypeScript
    // doesn't like that as it doesn't directly initialise these properties in
    // the constructor
    this._probability = initialProbability
    this.scaledProbability = scaleProbabilityToMatchSamplingRate(initialProbability)
  }

  get probability (): number {
    return this._probability
  }

  set probability (probability: number) {
    this._probability = probability
    this.scaledProbability = scaleProbabilityToMatchSamplingRate(probability)
  }

  get spanProbability (): number {
    return this.scaledProbability
  }

  sample (samplingRate: number): boolean {
    return samplingRate <= this.scaledProbability
  }
}

export default Sampler
