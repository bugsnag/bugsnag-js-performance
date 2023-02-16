export type Time = Date | number

export interface Span {
  end: (endTime?: Time) => void
}

export interface SpanInternal {
  readonly id: string // 64 bit random string
  readonly name: string
  readonly kind: 'internal' | 'server' | 'client' | 'producer' | 'consumer'
  readonly traceId: string // 128 bit random string
  readonly attributes: SpanAttributes
  readonly startTime: number // stored in the format returned from Clock.now (see clock.ts)
  endTime?: number // stored in the format returned from Clock.now (see clock.ts) - written once when 'end' is called
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

export type SpanAttribute = string | number | boolean

export class SpanAttributes {
  private readonly attributes: Map<string, SpanAttribute>

  constructor (initialValues: Map<string, SpanAttribute>) {
    this.attributes = new Map(Object.entries(initialValues))
  }

  public set (name: string, value: SpanAttribute) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      this.attributes.set(name, value)
    }
  }

  public remove (name: string) {
    this.attributes.delete(name)
  }
}
