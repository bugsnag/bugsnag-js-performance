interface NavigatorUABrandVersion {
  readonly brand: string
  readonly version: string
}

interface UADataValues {
  readonly brands?: NavigatorUABrandVersion[]
  readonly mobile?: boolean
  readonly architecture?: string
  readonly bitness?: string
  readonly model?: string
  readonly platform?: string
  readonly platformVersion?: string
  /** @deprecated in favour of fullVersionList */
  readonly uaFullVersion?: string
  readonly wow64?: boolean
  readonly fullVersionList?: NavigatorUABrandVersion[]
}

interface UALowEntropyJSON {
  readonly brands: NavigatorUABrandVersion[]
  readonly mobile: boolean
  readonly platform: string
}

interface NavigatorUAData {
  readonly brands: NavigatorUABrandVersion[]
  readonly mobile: boolean
  readonly platform: string
  getHighEntropyValues: (hints: string[]) => Promise<UADataValues>
  toJSON: () => UALowEntropyJSON
}

declare interface NavigatorUA {
  readonly userAgentData?: NavigatorUAData
}

declare interface Navigator extends NavigatorUA {}
declare interface WorkerNavigator extends NavigatorUA {}
