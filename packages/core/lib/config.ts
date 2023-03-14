export interface Logger {
  debug: (message: string) => void
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
}

export function isObject (obj: unknown): obj is Record<string, unknown> {
  return !!obj && typeof obj === 'object'
}

function isLogger (object: unknown): object is Logger {
  return isObject(object) &&
    typeof object.debug === 'function' &&
    typeof object.info === 'function' &&
    typeof object.warn === 'function' &&
    typeof object.error === 'function'
}

export interface Configuration {
  apiKey: string
  endpoint?: string
  releaseStage?: string
  logger?: Logger
}

export type InternalConfiguration = Required<Configuration>

export interface ConfigOption<T> {
  message: string
  defaultValue: T
  validate: (value: unknown) => value is T
}

export type Schema = Record<string, ConfigOption<unknown>>

export interface CoreSchema extends Schema {
  apiKey: ConfigOption<string>
  endpoint: ConfigOption<string>
  releaseStage: ConfigOption<string>
  logger: ConfigOption<Logger>
}

const isString = (value: unknown): value is string => typeof value === 'string'

export const coreSchema: CoreSchema = {
  endpoint: {
    defaultValue: 'https://otlp.bugsnag.com/v1/traces',
    message: 'should be a string',
    validate: isString
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
    validate: isString
  }
}

export function validateConfig (config: unknown, schema: Schema): InternalConfiguration {
  if (typeof config === 'string') { config = { apiKey: config } }

  if (!isObject(config) || !isString(config.apiKey) || config.apiKey.length === 0) {
    throw new Error('No Bugsnag API Key set')
  }

  const warnings = []
  const cleanConfiguration: Record<string, unknown> = {}

  for (const option of Object.keys(schema)) {
    if (Object.prototype.hasOwnProperty.call(config, option)) {
      if (schema[option].validate(config[option])) {
        cleanConfiguration[option] = config[option]
      } else {
        warnings.push(`Invalid configuration. ${option} ${schema[option].message}, got ${typeof config[option]}`)
        cleanConfiguration[option] = schema[option].defaultValue
      }
    } else {
      cleanConfiguration[option] = schema[option].defaultValue
    }
  }

  // If apiKey is set but not valid we should still use it, despite the validation warning.
  cleanConfiguration.apiKey = config.apiKey

  for (const warning of warnings) {
    (cleanConfiguration as InternalConfiguration).logger.warn(warning)
  }

  return cleanConfiguration as InternalConfiguration
}
