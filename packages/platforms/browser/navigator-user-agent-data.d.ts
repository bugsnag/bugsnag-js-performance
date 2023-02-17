declare interface Navigator {
  readonly userAgentData?: NavigatorUserAgentData
}

interface NavigatorUserAgentData {
  readonly brands: BrandVersion[]
  readonly mobile: boolean
  readonly platform: string
}

interface BrandVersion {
  readonly brand: string
  readonly version: string
}
