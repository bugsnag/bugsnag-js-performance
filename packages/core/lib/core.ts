import { SpanAttributes, type ResourceAttributeSource, type SpanAttributesSource } from './attributes'
import { type Clock } from './clock'
import { isObject, type ConfigOption, type Configuration, type CoreSchema, type InternalConfiguration } from './config'
import { type IdGenerator } from './id-generator'
import { BufferingProcessor, type Processor, type ProcessorFactory } from './processor'
import { Kind, type Span, type SpanInternal, type Time } from './span'

export interface BugsnagPerformance {
  start: (config: Configuration | string) => void
  startSpan: (name: string, startTime?: Time) => Span
}

type PlatformSchema = CoreSchema & Record<string, ConfigOption<unknown>>

function validate (config: unknown, schema: PlatformSchema): InternalConfiguration {
  if (typeof config === 'string') { config = { apiKey: config } }

  if (!isObject(config) || !schema.apiKey.validate(config.apiKey)) {
    throw new Error(schema.apiKey.message)
  }

  const warnings = []
  const cleanConfiguration: Record<string, unknown> = {}

  for (const option in schema) {
    if (option in config) {
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

  for (const warning of warnings) {
    (cleanConfiguration as InternalConfiguration).logger.warn(warning)
  }

  return cleanConfiguration as InternalConfiguration
}

function sanitizeTime (clock: Clock, time?: Time): number {
  if (typeof time === 'number') {
    // no need to change anything - we want to store numbers anyway
    // we assume this is nanosecond precision
    return time
  }

  if (time instanceof Date) {
    return clock.convert(time)
  }

  return clock.now()
}

export interface ClientOptions<SchemaType extends CoreSchema> {
  clock: Clock
  idGenerator: IdGenerator
  processorFactory: ProcessorFactory
  resourceAttributesSource: ResourceAttributeSource
  spanAttributesSource: SpanAttributesSource
  schema: SchemaType
}

export function createClient (options: ClientOptions<PlatformSchema>): BugsnagPerformance {
  const bufferingProcessor = new BufferingProcessor()
  let processor: Processor = bufferingProcessor

  return {
    start: (config: Configuration | string) => {
      const configuration = validate(config, options.schema)
      processor = options.processorFactory.create(configuration)
      bufferingProcessor.spans.forEach(span => {
        processor.add(span)
      })
    },
    startSpan: (name, startTime) => {
      const spanInternal: SpanInternal = {
        name,
        kind: Kind.Client, // TODO: How do we define the current kind?
        id: options.idGenerator.generate(64),
        traceId: options.idGenerator.generate(128),
        startTime: sanitizeTime(options.clock, startTime),
        attributes: new SpanAttributes(options.spanAttributesSource())
      }

      return {
        // TODO Expose internal span to platforms using Symbol / WeakMap?
        end: (endTime) => {
          processor.add({ ...spanInternal, endTime: sanitizeTime(options.clock, endTime) })
        }
      }
    }
  }
}

export function createNoopClient (): BugsnagPerformance {
  const noop = () => {}

  return {
    start: noop,
    startSpan: () => ({ end: noop })
  }
}
