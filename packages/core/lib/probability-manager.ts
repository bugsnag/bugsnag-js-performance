import type { Persistence } from './persistence'
import type ProbabilityFetcher from './probability-fetcher'
import type { ReadWriteSampler } from './sampler'

// the time between requests to fetch a new probability value from the server
const PROBABILITY_REFRESH_MILLISECONDS = 24 * 60 * 60 * 1000 // 24 hours

class ProbabilityManager {
  static async create (
    persistence: Persistence,
    sampler: ReadWriteSampler,
    probabilityFetcher: ProbabilityFetcher
  ) {
    const persistedProbability = await persistence.load('bugsnag-sampling-probability')

    let initialProbabilityTime: number

    if (persistedProbability === undefined) {
      // If there is no stored probability:
      // - Set the initial probability value to the default
      // - Immediately fetch a new probability value
      sampler.probability = 1.0
      initialProbabilityTime = 0
    } else if (persistedProbability.time < Date.now() - PROBABILITY_REFRESH_MILLISECONDS) {
      // If it is >= 24 hours old:
      // - Set the initial probability value to the stored value
      // - Immediately fetch a new probability value
      sampler.probability = persistedProbability.value
      initialProbabilityTime = persistedProbability.time
    } else {
      // If it is < 24 hours old:
      // - Use the stored probability
      // - Fetch a new probability when this value would be 24 hours old
      sampler.probability = persistedProbability.value
      initialProbabilityTime = persistedProbability.time
    }

    return new ProbabilityManager(
      persistence,
      sampler,
      probabilityFetcher,
      initialProbabilityTime
    )
  }

  private readonly persistence: Persistence
  private readonly sampler: ReadWriteSampler
  private readonly probabilityFetcher: ProbabilityFetcher

  private lastProbabilityTime: number

  private constructor (
    persistence: Persistence,
    sampler: ReadWriteSampler,
    probabilityFetcher: ProbabilityFetcher,
    initialProbabilityTime: number
  ) {
    this.persistence = persistence
    this.sampler = sampler
    this.probabilityFetcher = probabilityFetcher
    this.lastProbabilityTime = initialProbabilityTime
  }

  setProbability (newProbability: number): Promise<void> {
    this.lastProbabilityTime = Date.now()
    this.sampler.probability = newProbability

    // return this promise for convience in unit tests as it allows us to wait
    // for persistence to finish; in real code we won't ever wait for this but
    // there's no harm in returning it anyway
    return this.persistence.save('bugsnag-sampling-probability', {
      value: newProbability,
      time: this.lastProbabilityTime
    })
  }
}

export default ProbabilityManager
