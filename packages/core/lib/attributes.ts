export type SpanAttribute = string | number | boolean

export type SpanAttributesSource = Map<string, SpanAttribute>

export interface JSONAttribute {
  key: string
  value: { stringValue: string } | { intValue: string } | { doubleValue: number } | { boolValue: boolean }
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
