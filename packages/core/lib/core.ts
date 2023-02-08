import crypto from 'crypto'
import { millisecondsToNanoseconds } from './time'
import type { Processor } from './processor'
import type { Span, SpanInternal, Time } from './span'

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
  startSpan: (name: string, startTime?: Time) => Span
}

// TODO: find appropriate utility type
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

  if (typeof config.endpoint === 'string') {
    cleanConfiguration.endpoint = config.endpoint
  } else if (config.endpoint !== undefined) {
    cleanConfiguration.logger.warn(`Invalid configuration. endpoint should be a string, got ${typeof config.endpoint}`)
  }

  if (typeof config.releaseStage === 'string') {
    cleanConfiguration.releaseStage = config.releaseStage
  } else if (config.releaseStage !== undefined) {
    cleanConfiguration.logger.warn(`Invalid configuration. releaseStage should be a string, got ${typeof config.releaseStage}`)
  }

  return cleanConfiguration
}

function sanitizeTime (time?: Time): number {
  if (typeof time === 'number') {
    // no need to change anything - we want to store numbers anyway
    // we assume this is nanosecond precision
    return time
  }

  if (time instanceof Date) {
    return millisecondsToNanoseconds(time.getTime())
  }

  return performance.now() // TODO: implement clock functionality
}

function generateRandomId (bits = 64): string {
  return crypto.randomBytes(bits / 8).toString('hex')
}

interface ClientOptions {
  processor: Processor
}

export function createClient (options: ClientOptions): BugsnagPerformance {
  return {
    start: (config: Configuration | string) => {
      config = validate(config)
    },
    startSpan: (name, startTime) => {
      const spanInternal: SpanInternal = {
        id: generateRandomId(),
        traceId: generateRandomId(128),
        kind: 'client', // TODO: How do we define the current kind?
        name,
        startTime: sanitizeTime(startTime)
      }

      return {
        end: (endTime) => {
          options.processor.add({ ...spanInternal, endTime: sanitizeTime(endTime) })
        }
      }
    }
  }
}

export default createClient
