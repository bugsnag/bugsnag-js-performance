import { type InternalConfiguration } from '@bugsnag/js-performance-core'

function createConfiguration (overrides: Partial<InternalConfiguration> = {}): InternalConfiguration {
  return {
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
    ...overrides
  }
}

export default createConfiguration
