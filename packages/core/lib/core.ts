interface Logger {
  debug: (msg: string) => void
  info: (msg: string) => void
  warn: (msg: string) => void
  error: (msg: string) => void
}

export interface Configuration {
  apiKey: string
  endpoint?: string
  releaseStage?: string
  logger?: Logger
}

type InternalConfiguration = Required<Configuration>

export interface BugsnagPerformance {
  start: (config: Configuration | string) => void
}

function isObject (obj: unknown): obj is Record<string, unknown> {
  return !!obj && typeof obj === 'object'
}

function isLogger (object: unknown): object is Logger {
  return isObject(object) &&
    typeof object.debug === 'function' &&
    typeof object.info === 'function' &&
    typeof object.warn === 'function' &&
    typeof object.error === 'function'
}

const defaultLogger: Logger = {
  debug (message: string) { console.debug(message) },
  info (message: string) { console.info(message) },
  warn (message: string) { console.warn(message) },
  error (message: string) { console.error(message) }
}

function validate (config: unknown): InternalConfiguration {
  if (typeof config === 'string') { config = { apiKey: config } }

  if (!isObject(config) || typeof config.apiKey !== 'string') {
    throw new Error('No Bugsnag API Key set')
  }

  const cleanConfiguration: InternalConfiguration = {
    apiKey: config.apiKey,
    endpoint: 'https://otlp.bugsnag.com/v1/traces',
    releaseStage: 'production', // TODO: this should have a sensible default based on platform
    logger: defaultLogger
  }

  if (isLogger(config.logger)) {
    cleanConfiguration.logger = config.logger
  } else if (config.logger !== undefined) {
    cleanConfiguration.logger.warn(`Invalid configuration. logger should be a Logger object, got ${typeof config.logger}`)
  }

  if ('endpoint' in config) {
    typeof config.endpoint === 'string'
      ? cleanConfiguration.endpoint = config.endpoint
      : cleanConfiguration.logger.warn(`Invalid configuration. endpoint should be a string, got ${typeof config.endpoint}`)
  }

  if ('releaseStage' in config) {
    typeof config.releaseStage === 'string'
      ? cleanConfiguration.releaseStage = config.releaseStage
      : cleanConfiguration.logger.warn(`Invalid configuration. releaseStage should be a string, got ${typeof config.releaseStage}`)
  }

  return cleanConfiguration
}

export function createClient (): BugsnagPerformance {
  return {
    start: (config: Configuration | string) => {
      config = validate(config)
    }
  }
}

export default createClient
