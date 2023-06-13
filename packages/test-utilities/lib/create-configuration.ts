import { type Configuration, type InternalConfiguration } from '@bugsnag/core-performance'

function createConfiguration<C extends Configuration> (overrides: Partial<C> = {}): InternalConfiguration<C> {
  return {
    autoInstrumentFullPageLoads: false,
    autoInstrumentNetworkRequests: false,
    apiKey: 'abcdefabcdefabcdefabcdefabcdef12',
    endpoint: '/traces',
    releaseStage: 'production',
    enabledReleaseStages: null,
    maximumBatchSize: 100,
    batchInactivityTimeoutMs: 30 * 1000,
    retryQueueMaxSize: 1000,
    logger: {
      debug: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn()
    },
    appVersion: '',
    samplingProbability: 1.0,
    networkInstrumentationIgnoreUrls: [],
    ...overrides
  } as unknown as InternalConfiguration<C>
}

export default createConfiguration
