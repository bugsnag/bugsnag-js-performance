declare interface Navigator {
  readonly userAgentData?: NavigatorUserAgentData
}

interface NavigatorUserAgentData {
  readonly mobile: boolean
  readonly platform: string
}
