import type { Configuration, InternalConfiguration } from './config'
import type { SpanInternal } from './span'
import { isNumber } from './validation'

interface StringAttributeValue { stringValue: string }
interface IntAttributeValue { intValue: string }
interface DoubleAttributeValue { doubleValue: number }
interface BoolAttributeValue { boolValue: boolean }

type JsonAttributeValue = StringAttributeValue | IntAttributeValue | DoubleAttributeValue | BoolAttributeValue

type Attribute = string | number | boolean

// Array values should always be of the same type, although the trace server will accept mixed types
type ArrayAttribute = string[] | number[] | boolean[]

export type SpanAttribute = Attribute | ArrayAttribute

export interface SpanAttributesSource <C extends Configuration> {
  configure: (configuration: InternalConfiguration<C>) => void
  requestAttributes: (span: SpanInternal) => void
}

export class SpanAttributes {
  private readonly attributes: Map<string, SpanAttribute>

  constructor (initialValues: Map<string, SpanAttribute>) {
    this.attributes = initialValues
  }

  set (name: string, value: SpanAttribute) {
    if (typeof value === 'string' || typeof value === 'boolean' || isNumber(value) || Array.isArray(value)) {
      this.attributes.set(name, value)
    }
  }

  remove (name: string) {
    this.attributes.delete(name)
  }

  toJson () {
    return Array.from(this.attributes).map(([key, value]) => attributeToJson(key, value))
  }
}

export class ResourceAttributes extends SpanAttributes {
  constructor (releaseStage: string, appVersion: string, serviceName: string, sdkName: string, sdkVersion: string) {
    const initialValues = new Map([
      ['deployment.environment', releaseStage],
      ['telemetry.sdk.name', sdkName],
      ['telemetry.sdk.version', sdkVersion],
      ['service.name', serviceName]
    ])

    if (appVersion.length > 0) {
      initialValues.set('service.version', appVersion)
    }

    super(initialValues)
  }
}

export type ResourceAttributeSource<C extends Configuration>
  = (configuration: InternalConfiguration<C>) => Promise<ResourceAttributes>

export interface JsonAttribute {
  key: string
  value: JsonAttributeValue
}

export interface JsonArrayAttribute {
  key: string
  value: {
    arrayValue: {
      values?: JsonAttributeValue[]
    }
  }
}

function getJsonAttributeValue (value: Attribute, enforceDouble = false): JsonAttributeValue | undefined {
  switch (typeof value) {
    case 'number':
      if (Number.isNaN(value) || !Number.isFinite(value)) {
        return undefined
      }

      if (!enforceDouble && Number.isInteger(value)) {
        return { intValue: `${value}` }
      }

      return { doubleValue: value }
    case 'boolean':
      return { boolValue: value }
    case 'string':
      return { stringValue: value }
    default:
      // Ensure all JsonAttributeValue cases are handled
      value satisfies never
  }
}

function getJsonArrayAttributeValue (attributeArray: Attribute[]): JsonAttributeValue[] {
  return attributeArray
    .map((value) => getJsonAttributeValue(value))
    .filter(value => typeof value !== 'undefined')
}

/**
 * Converts a span attribute into an OTEL compliant value i.e. { stringValue: 'value' }
 * @param key the name of the span attribute
 * @param attribute the value of the attribute. Can be of type string | number | boolean | string[] | number[] | boolean[]. Invalid types will be removed from array attributes.
 * @returns
 */
export function attributeToJson (key: string, attribute: SpanAttribute): JsonAttribute | JsonArrayAttribute | undefined {
  switch (typeof attribute) {
    case 'number':
      if (Number.isNaN(attribute) || !Number.isFinite(attribute)) {
        return undefined
      }

      // 'bugsnag.sampling.p' must always be sent as a doubleValue
      if (key !== 'bugsnag.sampling.p' && Number.isInteger(attribute)) {
        return { key, value: { intValue: `${attribute}` } }
      }

      return { key, value: { doubleValue: attribute } }
    case 'boolean':
      return { key, value: { boolValue: attribute } }
    case 'string':
      return { key, value: { stringValue: attribute } }
    case 'object':
      if (Array.isArray(attribute)) {
        const arrayValues = getJsonArrayAttributeValue(attribute)
        return { key, value: { arrayValue: arrayValues.length > 0 ? { values: arrayValues } : {} } }
      }
      return undefined
    default:
      return undefined
  }
}
