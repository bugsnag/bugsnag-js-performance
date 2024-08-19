import type { ReadWriteSampler } from './sampler'

class FixedProbabilityManager {
  static async create (
    sampler: ReadWriteSampler,
    samplingProbability: number
  ) {
    sampler.probability = samplingProbability

    return new FixedProbabilityManager(
      sampler,
      samplingProbability
    )
  }

  private readonly sampler: ReadWriteSampler
  private readonly samplingProbability: number

  private constructor (
    sampler: ReadWriteSampler,
    samplingProbability: number
  ) {
    this.sampler = sampler
    this.samplingProbability = samplingProbability
  }

  setProbability (newProbability: number): Promise<void> {
    return Promise.resolve()
  }

  ensureFreshProbability (): Promise<void> {
    return Promise.resolve()
  }
}

export default FixedProbabilityManager
