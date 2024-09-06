import type { Configuration, InternalConfiguration } from './config'
import type { SpanInternal } from './span'
import { isNumber } from './validation'

export type SpanAttribute = string | number | boolean | Array<string | number | boolean>

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
  value: { stringValue: string } | { intValue: string } | { doubleValue: number } | { boolValue: boolean }
}

type AttributeArrayValueValue = Array<{ stringValue: string } | { intValue: string } | { doubleValue: number } | { boolValue: boolean }>

export interface JsonArrayAttribute {
  key: string
  value: {
    arrayValue: {
      values?: AttributeArrayValueValue
    }
  }
}

function getArrayAttributeValue (value: string | number | boolean) {
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
      return undefined
  }
}

function getArrayValue (attributeArray: Array<string | number | boolean>): AttributeArrayValueValue {
  return attributeArray
    .map((value) => getArrayAttributeValue(value))
    .filter(value => typeof value !== 'undefined')
}

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
        const arrayValues = getArrayValue(attribute)
        return { key, value: { arrayValue: arrayValues.length > 0 ? { values: arrayValues } : {} } }
      }
      return undefined
    default:
      return undefined
  }
}
