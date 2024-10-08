import type { Configuration, InternalConfiguration } from '@bugsnag/core-performance'

function createConfiguration<C extends Configuration> (overrides: Partial<C> = {}): InternalConfiguration<C> {
  return {
    autoInstrumentFullPageLoads: false,
    autoInstrumentNetworkRequests: false,
    apiKey: 'abcdefabcdefabcdefabcdefabcdef12',
    endpoint: '/traces',
    generateAnonymousId: true,
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
    networkRequestCallback: (networkRequestInfo: unknown) => networkRequestInfo,
    serviceName: 'unknown_service',
    samplingProbability: undefined,
    ...overrides
  } as unknown as InternalConfiguration<C>
}

export default createConfiguration
