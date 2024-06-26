import { type Persistence } from './persistence'
import type ProbabilityFetcher from './probability-fetcher'
import { type ReadWriteSampler } from './sampler'

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
    let initialTimeoutDuration: number

    if (persistedProbability === undefined) {
      // If there is no stored probability:
      // - Set the initial probability value to the default
      sampler.probability = 1.0
      initialProbabilityTime = 0

      // - Immediately fetch a new probability value
      initialTimeoutDuration = 0
    } else if (persistedProbability.time < Date.now() - PROBABILITY_REFRESH_MILLISECONDS) {
      // If it is >= 24 hours old:
      // - Set the initial probability value to the stored value
      sampler.probability = persistedProbability.value
      initialProbabilityTime = persistedProbability.time

      // - Immediately fetch a new probability value
      initialTimeoutDuration = 0
    } else {
      // If it is < 24 hours old:
      // - Use the stored probability
      sampler.probability = persistedProbability.value
      initialProbabilityTime = persistedProbability.time

      // - Fetch a new probability when this value would be 24 hours old
      initialTimeoutDuration = PROBABILITY_REFRESH_MILLISECONDS - (Date.now() - initialProbabilityTime)
    }

    return new ProbabilityManager(
      persistence,
      sampler,
      probabilityFetcher,
      initialTimeoutDuration,
      initialProbabilityTime
    )
  }

  private readonly persistence: Persistence
  private readonly sampler: ReadWriteSampler
  private readonly probabilityFetcher: ProbabilityFetcher

  private lastProbabilityTime: number
  private timeout: ReturnType<typeof setTimeout> | undefined = undefined

  // This promise is resolved when the initial sampling request has been made
  public fetchingInitialProbability
  private resolveInitialProbability?: (value?: unknown) => void

  private constructor (
    persistence: Persistence,
    sampler: ReadWriteSampler,
    probabilityFetcher: ProbabilityFetcher,
    initialTimeoutDuration: number,
    initialProbabilityTime: number
  ) {
    this.persistence = persistence
    this.sampler = sampler
    this.probabilityFetcher = probabilityFetcher
    this.lastProbabilityTime = initialProbabilityTime

    if (initialTimeoutDuration === 0) {
      this.fetchingInitialProbability = new Promise((resolve) => {
        this.resolveInitialProbability = resolve
      })
    }

    this.fetchNewProbabilityIn(initialTimeoutDuration)
  }

  setProbability (newProbability: number): Promise<void> {
    this.lastProbabilityTime = Date.now()
    this.sampler.probability = newProbability

    this.fetchNewProbabilityIn(PROBABILITY_REFRESH_MILLISECONDS)

    // return this promise for convience in unit tests as it allows us to wait
    // for persistence to finish; in real code we won't ever wait for this but
    // there's no harm in returning it anyway
    return this.persistence.save('bugsnag-sampling-probability', {
      value: newProbability,
      time: this.lastProbabilityTime
    })
  }

  private fetchNewProbabilityIn (milliseconds: number): void {
    clearTimeout(this.timeout)

    const lastProbabilityTimeBeforeTimeout = this.lastProbabilityTime

    this.timeout = setTimeout(
      async () => {
        const probability = await this.probabilityFetcher.getNewProbability()

        // only apply the new probability if we haven't received another value
        // in the meantime, e.g. from a trace request's response
        if (lastProbabilityTimeBeforeTimeout === this.lastProbabilityTime) {
          this.setProbability(probability)
        }

        // Initial sampling request has been made, and we can unblock batching
        if (this.resolveInitialProbability) {
          this.resolveInitialProbability()
          this.resolveInitialProbability = undefined
          this.fetchingInitialProbability = undefined
        }
      },
      milliseconds
    )
  }
}

export default ProbabilityManager
