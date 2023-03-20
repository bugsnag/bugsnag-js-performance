export const VALID_API_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'

export const VALID_CONFIGURATION = {
  apiKey: VALID_API_KEY,
  releaseStage: 'test',
  enabledReleaseStages: ['test'],
  appVersion: '1.0.0',
  batchInactivityTimeoutMs: 30 * 1000,
  maximumBatchSize: 100,
  endpoint: '/traces',
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}
