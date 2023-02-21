export type SpanAttribute = string | number | boolean

export type SpanAttributesSource = Map<string, SpanAttribute>

export interface JsonAttribute {
  key: string
  value: { stringValue: string }
  | { intValue: string }
  | { doubleValue: number }
  | { boolValue: boolean }
}

export interface ResourceAttributes {
  brands?: Array<{ name: string, version: string }> // browser.brands
  platform?: string // browser.platform
  mobile?: boolean // browser.mobile
  userAgent: string // browser.user_agent
  releaseStage: string // deployment.environment
  sdkName: string // telemetry.sdk.name
  sdkVersion: string // telemetry.sdk.version
}

export type ResourceAttributeSource = () => ResourceAttributes

export function attributeToJson (key: string, attribute: SpanAttribute): JsonAttribute | undefined {
  switch (typeof attribute) {
    case 'number':
      if (Number.isNaN(attribute) || !Number.isFinite(attribute)) {
        return undefined
      }
      if (Number.isInteger(attribute)) {
        return { key, value: { intValue: `${attribute}` } }
      }
      return { key, value: { doubleValue: attribute } }
    case 'boolean':
      return { key, value: { boolValue: attribute } }
    case 'string':
      return { key, value: { stringValue: attribute } }
    default:
      return undefined
  }
}
