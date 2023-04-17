import { schema as coreSchema, validateConfig, type CoreSchema } from '../lib/config'
import { VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'

describe('Schema validation', () => {
  it('logs a warning if a config option is invalid', () => {
    const schema: CoreSchema = {
      ...coreSchema,
      newValue: {
        defaultValue: 'default-new-value',
        message: 'is not valid',
        validate: (value): value is string => typeof value === 'string'
      }
    }

    const config = {
      apiKey: VALID_API_KEY,
      newValue: 12345,
      logger: {
        warn: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
      }
    }

    validateConfig(config, schema)

    expect(config.logger.warn).toHaveBeenCalledWith('Invalid configuration\n  - newValue is not valid, got number')
  })

  it('logs a warning if two or more config options are invalid', () => {
    const schema: CoreSchema = {
      ...coreSchema,
      newValue: {
        defaultValue: 'default-new-value',
        message: 'should be a default-new-value',
        validate: (value): value is string => typeof value === 'string'
      }
    }

    const config = {
      apiKey: VALID_API_KEY,
      newValue: 12345,
      endpoint: () => {},
      logger: {
        warn: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
      }
    }

    validateConfig(config, schema)

    expect(config.logger.warn).toHaveBeenCalledWith('Invalid configuration\n  - endpoint should be a string, got function\n  - newValue should be a default-new-value, got number')
  })

  it('uses the default value if one is not provided', () => {
    const schema: CoreSchema = {
      ...coreSchema,
      endpoint: {
        defaultValue: 'default-endpoint',
        message: 'should be a string',
        validate: (value): value is string => typeof value === 'string'
      }
    }

    const validConfig = validateConfig(VALID_API_KEY, schema)

    expect(validConfig.endpoint).toStrictEqual('default-endpoint')
  })

  it('uses the default value if config option is invalid', () => {
    const schema: CoreSchema = {
      ...coreSchema,
      endpoint: {
        defaultValue: 'default-endpoint',
        message: 'should be a string',
        validate: (value): value is string => typeof value === 'string'
      }
    }

    const config = {
      apiKey: VALID_API_KEY,
      endpoint: 12345,
      logger: {
        warn: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
      }
    }

    const validConfig = validateConfig(config, schema)

    expect(validConfig.endpoint).toStrictEqual('default-endpoint')
  })

  describe('Core Schema', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    describe('appVersion', () => {
      it('accepts a valid value', () => {
        const config = {
          apiKey: VALID_API_KEY,
          appVersion: '1.2.3'
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.appVersion).toBe('1.2.3')
      })

      it('replaces an invalid value with the default', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

        const config = {
          apiKey: VALID_API_KEY,
          appVersion: 123
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.appVersion).toBe('')
      })
    })

    describe('samplingProbability', () => {
      it('accepts a valid value', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

        const config = {
          apiKey: VALID_API_KEY,
          samplingProbability: 0.5
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.samplingProbability).toBe(0.5)

        expect(console.warn).not.toHaveBeenCalled()
      })

      it('replaces a value <0 with the default', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

        const config = {
          apiKey: VALID_API_KEY,
          samplingProbability: -0.1
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.samplingProbability).toBe(1.0)

        expect(console.warn).toHaveBeenCalledWith('Invalid configuration\n  - samplingProbability should be a number between 0 and 1, got number')
      })

      it('replaces a value >1 with the default', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

        const config = {
          apiKey: VALID_API_KEY,
          samplingProbability: 1.1
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.samplingProbability).toBe(1.0)

        expect(console.warn).toHaveBeenCalledWith('Invalid configuration\n  - samplingProbability should be a number between 0 and 1, got number')
      })
    })
  })
})
