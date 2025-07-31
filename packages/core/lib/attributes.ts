import type { Configuration, InternalConfiguration, Logger } from './config'
import { ATTRIBUTE_KEY_LENGTH_LIMIT, defaultResourceAttributeLimits } from './custom-attribute-limits'
import type { SpanInternal } from './span'
import { isNumber } from './validation'

interface StringAttributeValue { stringValue: string }
interface IntAttributeValue { intValue: string }
interface DoubleAttributeValue { doubleValue: number }
interface BoolAttributeValue { boolValue: boolean }

type SingleAttributeValue = StringAttributeValue | IntAttributeValue | DoubleAttributeValue | BoolAttributeValue

interface ArrayAttributeValue {
  arrayValue: {
    values?: SingleAttributeValue[]
  }
}

type JsonAttributeValue = SingleAttributeValue | ArrayAttributeValue

export interface JsonAttribute {
  key: string
  value: JsonAttributeValue
}

type Attribute = string | number | boolean

// Array values should always be of the same type, although the trace server will accept mixed types
type ArrayAttribute = string[] | number[] | boolean[]

export type SpanAttribute = Attribute | ArrayAttribute | null

export interface SpanAttributesSource <C extends Configuration> {
  configure: (configuration: InternalConfiguration<C>) => void
  requestAttributes: (span: SpanInternal) => void
}

export interface SpanAttributesLimits {
  attributeStringValueLimit: number
  attributeArrayLengthLimit: number
  attributeCountLimit: number
}

function truncateString (value: string, limit: number) {
  const originalLength = value.length
  const newString = value.slice(0, limit)
  const truncatedLength = newString.length

  return `${newString} *** ${originalLength - truncatedLength} CHARS TRUNCATED`
}

export class SpanAttributes {
  private readonly attributes: Map<string, SpanAttribute>
  private readonly logger: Logger
  private readonly spanAttributeLimits: SpanAttributesLimits
  private readonly spanName: string
  private _droppedAttributesCount = 0

  get droppedAttributesCount () {
    return this._droppedAttributesCount
  }

  constructor (initialValues: Map<string, SpanAttribute>, spanAttributeLimits: SpanAttributesLimits, spanName: string, logger: Logger) {
    this.attributes = initialValues
    this.spanAttributeLimits = spanAttributeLimits
    this.spanName = spanName
    this.logger = logger
  }

  private truncateAttribute (name: string, value: SpanAttribute) {
    if (typeof value === 'string' && value.length > this.spanAttributeLimits.attributeStringValueLimit) {
      this.attributes.set(name, truncateString(value, this.spanAttributeLimits.attributeStringValueLimit))
      this.logger.warn(`Span attribute ${name} in span ${this.spanName} was truncated as the string exceeds the ${this.spanAttributeLimits.attributeStringValueLimit} character limit set by attributeStringValueLimit.`)
    }

    if (Array.isArray(value) && value.length > this.spanAttributeLimits.attributeArrayLengthLimit) {
      const truncatedValue = value.slice(0, this.spanAttributeLimits.attributeArrayLengthLimit)
      this.attributes.set(name, truncatedValue)
      this.logger.warn(`Span attribute ${name} in span ${this.spanName} was truncated as the array exceeds the ${this.spanAttributeLimits.attributeArrayLengthLimit} element limit set by attributeArrayLengthLimit.`)
    }
  }

  private isValidAttributeValue (value: SpanAttribute): boolean {
    return value === null || typeof value === 'string' || typeof value === 'boolean' || isNumber(value) || Array.isArray(value)
  }

  private isValidAttributeName (name: string): boolean {
    return typeof name === 'string' && name.length > 0
  }

  // Used to set internal attributes
  set (name: string, value: SpanAttribute) {
    if (!this.isValidAttributeName(name) || !this.isValidAttributeValue(value)) return

    if (value === null) {
      this.remove(name)
      return
    }

    this.attributes.set(name, value)
  }

  // Used by the public API to set custom attributes
  setCustom (name: string, value: SpanAttribute) {
    if (!this.isValidAttributeName(name) || !this.isValidAttributeValue(value)) return

    if (value === null) {
      this.remove(name)
      return
    }

    if (!this.attributes.has(name) && this.attributes.size >= this.spanAttributeLimits.attributeCountLimit) {
      this._droppedAttributesCount++
      this.logger.warn(`Span attribute ${name} in span ${this.spanName} was dropped as the number of attributes exceeds the ${this.spanAttributeLimits.attributeCountLimit} attribute limit set by attributeCountLimit.`)
      return
    }

    if (name.length > ATTRIBUTE_KEY_LENGTH_LIMIT) {
      this._droppedAttributesCount++
      this.logger.warn(`Span attribute ${name} in span ${this.spanName} was dropped as the key length exceeds the ${ATTRIBUTE_KEY_LENGTH_LIMIT} character fixed limit.`)
      return
    }

    this.attributes.set(name, value)
  }

  remove (name: string) {
    this.attributes.delete(name)
  }

  toJson () {
    Array.from(this.attributes).forEach(([key, value]) => { this.truncateAttribute(key, value) })
    return Array.from(this.attributes)
      .map(([key, value]) => attributeToJson(key, value))
      .filter(attr => attr !== undefined)
  }

  toObject () {
    return Object.fromEntries(this.attributes)
  }
}

export class ResourceAttributes extends SpanAttributes {
  constructor (releaseStage: string, appVersion: string, serviceName: string, sdkName: string, sdkVersion: string, logger: Logger) {
    const initialValues = new Map([
      ['deployment.environment', releaseStage],
      ['telemetry.sdk.name', sdkName],
      ['telemetry.sdk.version', sdkVersion],
      ['service.name', serviceName]
    ])

    if (appVersion.length > 0) {
      initialValues.set('service.version', appVersion)
    }

    // TODO: this class should be refactored to use a common base class instead of SpanAttributes
    // since we don't need a span name and logger for resource attributes - see PLAT-12820
    super(initialValues, defaultResourceAttributeLimits, 'resource-attributes', logger)
  }
}

export type ResourceAttributeSource<C extends Configuration>
  = (configuration: InternalConfiguration<C>) => Promise<ResourceAttributes>

function getJsonAttributeValue (value: Attribute): SingleAttributeValue | undefined {
  switch (typeof value) {
    case 'number':
      if (Number.isNaN(value) || !Number.isFinite(value)) {
        return undefined
      }

      if (Number.isInteger(value)) {
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

function getJsonArrayAttributeValue (attributeArray: Attribute[]): SingleAttributeValue[] {
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
export function attributeToJson (key: string, attribute: SpanAttribute): JsonAttribute | undefined {
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
