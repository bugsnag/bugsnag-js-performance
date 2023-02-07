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

export interface BugsnagPerformance {
  start: (config: Configuration | string) => void
}

function isObject (obj: unknown): obj is Record<string, unknown> {
  return !!obj && typeof obj === 'object'
}

function validate (config: unknown): Configuration {
  if (typeof config === 'string') { config = { apiKey: config } }

  if (!isObject(config) || typeof config.apiKey !== 'string') {
    throw new Error('No Bugsnag API Key set')
  }

  const cleanConfiguration: Configuration = {
    apiKey: config.apiKey
  }

  if ('endpoint' in config) {
    typeof config.endpoint === 'string'
      ? cleanConfiguration.endpoint = config.endpoint
      : console.warn(`Invalid configuration. endpoint should be a string, got ${typeof config.endpoint}`)
  }

  if ('releaseStage' in config) {
    typeof config.releaseStage === 'string'
      ? cleanConfiguration.releaseStage = config.releaseStage
      : console.warn(`Invalid configuration. releaseStage should be a string, got ${typeof config.releaseStage}`)
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
