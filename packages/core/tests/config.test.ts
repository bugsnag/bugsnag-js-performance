import { coreSchema, validateConfig, type PlatformSchema } from '../lib/config'

describe('Schema validation', () => {
  it('logs a warning if a config option is invalid', () => {
    const schema: PlatformSchema = {
      ...coreSchema,
      newValue: {
        defaultValue: 'default-new-value',
        message: 'is not valid',
        validate: (value): value is string => typeof value === 'string'
      }
    }

    const config = {
      apiKey: 'valid-api-key',
      newValue: 12345,
      logger: {
        warn: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        error: jest.fn()
      }
    }

    validateConfig(config, schema)

    expect(config.logger.warn).toHaveBeenCalledWith('Invalid configuration. newValue is not valid, got number')
  })

  it('logs a multi-line warning if two or more config options are invalid', () => {
    const schema: PlatformSchema = {
      ...coreSchema,
      newValue: {
        defaultValue: 'default-new-value',
        message: 'should be a default-new-value',
        validate: (value): value is string => typeof value === 'string'
      }
    }

    const config = {
      apiKey: 'valid-api-key',
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
    const schema: PlatformSchema = {
      ...coreSchema,
      endpoint: {
        defaultValue: 'default-endpoint',
        message: 'should be a string',
        validate: (value): value is string => typeof value === 'string'
      }
    }

    const config = {
      apiKey: 'valid-api-key'
    }

    const validConfig = validateConfig(config, schema)

    expect(validConfig.endpoint).toStrictEqual('default-endpoint')
  })

  it('uses the default value if config option is invalid', () => {
    const schema: PlatformSchema = {
      ...coreSchema,
      endpoint: {
        defaultValue: 'default-endpoint',
        message: 'should be a string',
        validate: (value): value is string => typeof value === 'string'
      }
    }

    const config = {
      apiKey: 'valid-api-key',
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
})
