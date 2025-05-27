import { schema as coreSchema, validateConfig } from '../lib/config'
import type { CoreSchema } from '../lib/config'
import { VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'
import {
  ATTRIBUTE_ARRAY_LENGTH_LIMIT_DEFAULT,
  ATTRIBUTE_COUNT_LIMIT_DEFAULT,
  ATTRIBUTE_STRING_VALUE_LIMIT_DEFAULT,
  ATTRIBUTE_ARRAY_LENGTH_LIMIT_MAX,
  ATTRIBUTE_COUNT_LIMIT_MAX,
  ATTRIBUTE_STRING_VALUE_LIMIT_MAX
} from '../lib/custom-attribute-limits'

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
        const config = {
          apiKey: VALID_API_KEY,
          samplingProbability: 0.95
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.samplingProbability).toBe(0.95)
      })

      it('replaces an invalid value with the default', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

        const config = {
          apiKey: VALID_API_KEY,
          samplingProbability: 'abc'
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.samplingProbability).toBe(undefined)
      })

      it('uses the default if the value is out of range', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

        const config = {
          apiKey: VALID_API_KEY,
          samplingProbability: 2
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.samplingProbability).toBe(undefined)
      })
    })

    describe('attributeStringValueLimit', () => {
      it('accepts a valid value', () => {
        const config = {
          apiKey: VALID_API_KEY,
          attributeStringValueLimit: 100
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.attributeStringValueLimit).toBe(100)
      })

      it('replaces an invalid value with the default', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

        const config = {
          apiKey: VALID_API_KEY,
          attributeStringValueLimit: 'abc'
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.attributeStringValueLimit).toBe(ATTRIBUTE_STRING_VALUE_LIMIT_DEFAULT)
      })

      it('uses the default if the value is out of range', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

        const config = {
          apiKey: VALID_API_KEY,
          attributeStringValueLimit: ATTRIBUTE_STRING_VALUE_LIMIT_MAX + 1
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.attributeStringValueLimit).toBe(ATTRIBUTE_STRING_VALUE_LIMIT_DEFAULT)
      })
    })

    describe('attributeArrayLengthLimit', () => {
      it('accepts a valid value', () => {
        const config = {
          apiKey: VALID_API_KEY,
          attributeArrayLengthLimit: 50
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.attributeArrayLengthLimit).toBe(50)
      })

      it('replaces an invalid value with the default', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

        const config = {
          apiKey: VALID_API_KEY,
          attributeArrayLengthLimit: 'abc'
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.attributeArrayLengthLimit).toBe(ATTRIBUTE_ARRAY_LENGTH_LIMIT_DEFAULT)
      })

      it('uses the default if the value is out of range', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

        const config = {
          apiKey: VALID_API_KEY,
          attributeArrayLengthLimit: ATTRIBUTE_ARRAY_LENGTH_LIMIT_MAX + 1
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.attributeArrayLengthLimit).toBe(ATTRIBUTE_ARRAY_LENGTH_LIMIT_DEFAULT)
      })
    })

    describe('attributeCountLimit', () => {
      it('accepts a valid value', () => {
        const config = {
          apiKey: VALID_API_KEY,
          attributeCountLimit: 50
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.attributeCountLimit).toBe(50)
      })

      it('replaces an invalid value with the default', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

        const config = {
          apiKey: VALID_API_KEY,
          attributeCountLimit: 'abc'
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.attributeCountLimit).toBe(ATTRIBUTE_COUNT_LIMIT_DEFAULT)
      })

      it('uses the default if the value is out of range', () => {
        jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

        const config = {
          apiKey: VALID_API_KEY,
          attributeCountLimit: ATTRIBUTE_COUNT_LIMIT_MAX + 1
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.attributeCountLimit).toBe(ATTRIBUTE_COUNT_LIMIT_DEFAULT)
      })
    })

    describe('onSpanStart', () => {
      it('accepts valid callbacks', () => {
        const callbacks = [() => {}, () => {}]
        const config = {
          apiKey: VALID_API_KEY,
          onSpanStart: callbacks
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.onSpanStart).toBe(callbacks)
      })

      it('replaces invalid callbacks with undefined', () => {
        const config = {
          apiKey: VALID_API_KEY,
          onSpanStart: [() => {}, 'not a function']
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.onSpanStart).toBe(undefined)
      })
    })

    describe('onSpanEnd', () => {
      it('accepts valid callbacks', () => {
        const callbacks = [() => true, () => false]
        const config = {
          apiKey: VALID_API_KEY,
          onSpanEnd: callbacks
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.onSpanEnd).toBe(callbacks)
      })

      it('replaces invalid callbacks with undefined', () => {
        const config = {
          apiKey: VALID_API_KEY,
          onSpanEnd: [() => true, 'not a function']
        }

        const validConfig = validateConfig(config, coreSchema)
        expect(validConfig.onSpanEnd).toBe(undefined)
      })
    })
  })
})
