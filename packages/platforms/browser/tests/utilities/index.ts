import { type InternalConfiguration } from '@bugsnag/js-performance-core'

export function createConfiguration (overrides: Partial<InternalConfiguration> = {}): InternalConfiguration {
  return {
    apiKey: 'abcdefabcdefabcdefabcdefabcdef12',
    endpoint: '/traces',
    releaseStage: 'production',
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
