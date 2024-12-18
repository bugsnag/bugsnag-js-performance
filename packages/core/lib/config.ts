import type { OnSpanEndCallbacks } from './batch-processor'
import {
  ATTRIBUTE_ARRAY_LENGTH_LIMIT_DEFAULT,
  ATTRIBUTE_COUNT_LIMIT_DEFAULT,
  ATTRIBUTE_STRING_VALUE_LIMIT_DEFAULT,
  ATTRIBUTE_ARRAY_LENGTH_LIMIT_MAX,
  ATTRIBUTE_COUNT_LIMIT_MAX,
  ATTRIBUTE_STRING_VALUE_LIMIT_MAX
} from './custom-attribute-limits'
import type { Plugin } from './plugin'
import { isBoolean, isLogger, isNumber, isObject, isOnSpanEndCallbacks, isPluginArray, isString, isStringArray, isStringWithLength } from './validation'

type SetTraceCorrelation = (traceId: string, spanId: string) => void

interface BugsnagErrorEvent {
  setTraceCorrelation?: SetTraceCorrelation
}

type BugsnagErrorCallback = (event: BugsnagErrorEvent) => void

interface BugsnagErrorStatic {
  addOnError: (fn: BugsnagErrorCallback) => void
  Event: {
    prototype: {
      setTraceCorrelation?: SetTraceCorrelation
    }
  }
  Client?: {
    prototype: {
      _notify: (event: BugsnagErrorEvent) => void
    }
  }
}

export interface Logger {
  debug: (message: string) => void
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
}

export interface Configuration {
  apiKey: string
  endpoint?: string
  releaseStage?: string
  logger?: Logger
  appVersion?: string
  enabledReleaseStages?: string[] | null
  plugins?: Array<Plugin<Configuration>>
  bugsnag?: BugsnagErrorStatic
  samplingProbability?: number
  onSpanEnd?: OnSpanEndCallbacks
  attributeStringValueLimit?: number
  attributeArrayLengthLimit?: number
  attributeCountLimit?: number
  sendPayloadChecksums?: boolean
}

export interface TestConfiguration {
  maximumBatchSize: number
  batchInactivityTimeoutMs: number
  retryQueueMaxSize: number
}

export type InternalConfiguration<C extends Configuration> = Required<C> & Required<Configuration> & TestConfiguration

export interface ConfigOption<T> {
  message: string
  defaultValue: T
  validate: (value: unknown) => value is T
}

type Schema = Record<string, ConfigOption<unknown>>

export interface CoreSchema extends Schema {
  apiKey: ConfigOption<string>
  endpoint: ConfigOption<string>
  releaseStage: ConfigOption<string>
  logger: ConfigOption<Logger>
  appVersion: ConfigOption<string>
  enabledReleaseStages: ConfigOption<string[] | null>
  plugins: ConfigOption<Array<Plugin<Configuration>>>
  bugsnag: ConfigOption<BugsnagErrorStatic | undefined>
  samplingProbability: ConfigOption<number | undefined>
  sendPayloadChecksums: ConfigOption<boolean>
}

export const schema: CoreSchema = {
  appVersion: {
    defaultValue: '',
    message: 'should be a string',
    validate: isStringWithLength
  },
  endpoint: {
    defaultValue: 'https://otlp.bugsnag.com/v1/traces',
    message: 'should be a string',
    validate: isStringWithLength
  },
  apiKey: {
    defaultValue: '',
    message: 'should be a 32 character hexadecimal string',
    validate: (value: unknown): value is string => isString(value) && /^[a-f0-9]{32}$/.test(value)
  },
  logger: {
    defaultValue: {
      debug (message: string) { console.debug(message) },
      info (message: string) { console.info(message) },
      warn (message: string) { console.warn(message) },
      error (message: string) { console.error(message) }
    },
    message: 'should be a Logger object',
    validate: isLogger
  },
  releaseStage: {
    defaultValue: 'production',
    message: 'should be a string',
    validate: isStringWithLength
  },
  enabledReleaseStages: {
    defaultValue: null,
    message: 'should be an array of strings',
    validate: (value: unknown): value is string[] | null => value === null || isStringArray(value)
  },
  plugins: {
    defaultValue: [],
    message: 'should be an array of plugin objects',
    validate: isPluginArray
  },
  bugsnag: {
    defaultValue: undefined,
    message: 'should be an instance of Bugsnag',
    validate: (value: unknown): value is BugsnagErrorStatic => isObject(value) && typeof value.addOnError === 'function'
  },
  samplingProbability: {
    defaultValue: undefined,
    message: 'should be a number between 0 and 1',
    validate: (value: unknown): value is number | undefined => value === undefined || (isNumber(value) && value >= 0 && value <= 1)
  },
  onSpanEnd: {
    defaultValue: undefined,
    message: 'should be an array of functions',
    validate: isOnSpanEndCallbacks
  },
  attributeStringValueLimit: {
    defaultValue: ATTRIBUTE_STRING_VALUE_LIMIT_DEFAULT,
    message: `should be a number between 1 and ${ATTRIBUTE_STRING_VALUE_LIMIT_MAX}`,
    validate: (value: unknown): value is number => isNumber(value) && value > 0 && value <= ATTRIBUTE_STRING_VALUE_LIMIT_MAX
  },
  attributeArrayLengthLimit: {
    defaultValue: ATTRIBUTE_ARRAY_LENGTH_LIMIT_DEFAULT,
    message: `should be a number between 1 and ${ATTRIBUTE_ARRAY_LENGTH_LIMIT_MAX}`,
    validate: (value: unknown): value is number => isNumber(value) && value > 0 && value <= ATTRIBUTE_ARRAY_LENGTH_LIMIT_MAX
  },
  attributeCountLimit: {
    defaultValue: ATTRIBUTE_COUNT_LIMIT_DEFAULT,
    message: `should be a number between 1 and ${ATTRIBUTE_COUNT_LIMIT_MAX}`,
    validate: (value: unknown): value is number => isNumber(value) && value > 0 && value <= ATTRIBUTE_COUNT_LIMIT_MAX
  },
  sendPayloadChecksums: {
    defaultValue: false,
    message: 'should be true|false',
    validate: isBoolean
  }
}

// @ts-expect-error this global variable is injected when building
if (typeof __ENABLE_BUGSNAG_TEST_CONFIGURATION__ !== 'undefined' && __ENABLE_BUGSNAG_TEST_CONFIGURATION__) {
  // in test builds, allow customising the maximum batch size and the timeout
  // between sending batches
  // this allows our e2e tests to run without having to create 100 batches or
  // wait 30 seconds for delviery to kick in

  // the maximum size allowed in a batch - when the queue reaches this size
  // the batch will be sent to delivery
  schema.maximumBatchSize = {
    message: 'should be a number',
    defaultValue: 100,
    validate: isNumber
  }

  // the number of seconds to wait after adding a span to a batch for that
  // batch to be sent to delivery if no other spans are added
  schema.batchInactivityTimeoutMs = {
    message: 'should be a number',
    defaultValue: 30 * 1000, // 30 seconds
    validate: isNumber
  }

  // the maximum number of spans to have in a retry queue
  schema.retryQueueMaxSize = {
    message: 'should be a number',
    defaultValue: 1000,
    validate: isNumber
  }
}

export function validateConfig<S extends CoreSchema, C extends Configuration> (config: unknown, schema: S): InternalConfiguration<C> {
  if (typeof config === 'string') { config = { apiKey: config } }

  if (!isObject(config) || !isString(config.apiKey) || config.apiKey.length === 0) {
    throw new Error('No Bugsnag API Key set')
  }

  let warnings = ''
  const cleanConfiguration: Record<string, unknown> = {}

  for (const option of Object.keys(schema)) {
    if (Object.prototype.hasOwnProperty.call(config, option)) {
      if (schema[option].validate(config[option])) {
        cleanConfiguration[option] = config[option]
      } else {
        warnings += `\n  - ${option} ${schema[option].message}, got ${typeof config[option]}`
        cleanConfiguration[option] = schema[option].defaultValue
      }
    } else {
      cleanConfiguration[option] = schema[option].defaultValue
    }
  }

  // If apiKey is set but not valid we should still use it, despite the validation warning.
  cleanConfiguration.apiKey = config.apiKey
  cleanConfiguration.maximumBatchSize = config.maximumBatchSize || 100
  cleanConfiguration.batchInactivityTimeoutMs = config.batchInactivityTimeoutMs || 30 * 1000

  if (warnings.length > 0) {
    (cleanConfiguration as unknown as InternalConfiguration<Configuration>).logger.warn(`Invalid configuration${warnings}`)
  }

  return cleanConfiguration as unknown as InternalConfiguration<C>
}
