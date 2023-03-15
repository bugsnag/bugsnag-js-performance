import { isObject, isLogger, isString, isStringWithLength } from './validation'

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
}

export type InternalConfiguration = Required<Configuration>

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

  if (warnings.length > 0) {
    (cleanConfiguration as unknown as InternalConfiguration).logger.warn(`Invalid configuration${warnings}`)
  }

  return cleanConfiguration as unknown as InternalConfiguration
}
