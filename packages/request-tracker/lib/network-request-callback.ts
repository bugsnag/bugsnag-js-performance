export interface NetworkRequestInfo {
  url: string | null
  propagateTraceContext?: boolean
}

export type NetworkRequestCallback <T extends NetworkRequestInfo> = (networkRequestInfo: T) => T | null

export function defaultNetworkRequestCallback <T extends NetworkRequestInfo> (networkRequestInfo: T) {
  return networkRequestInfo
}

export function isNetworkRequestCallback <T extends NetworkRequestInfo> (value: unknown): value is NetworkRequestCallback<T> {
  return typeof value === 'function'
}
