export interface NetworkRequestInfo {
  url: string
  readonly type: string
}

export type NetworkRequestCallback = (networkRequestInfo: NetworkRequestInfo) => NetworkRequestInfo | null

export function defaultNetworkRequestCallback (networkRequestInfo: NetworkRequestInfo) {
  return networkRequestInfo
}

export function isNetworkRequestCallback (value: unknown): value is NetworkRequestCallback {
  return typeof value === 'function'
}
