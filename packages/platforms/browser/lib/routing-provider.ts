import { isObject, type Time } from '@bugsnag/core-performance'
import { type OnSettleCallback } from './on-settle'

export type OnRouteChangeCallback = (newRoute: string, routeChangeTime?: Time) => void

export interface RoutingProvider {
  readonly initialRoute: string
  onRouteChange: (callback: OnRouteChangeCallback) => void
  onSettle: (callback: OnSettleCallback) => void
}

export type RouteResolver = (url: URL) => string

export const isRoutingProvider = (value: unknown): value is RoutingProvider =>
  isObject(value) &&
    typeof value.initialRoute === 'string' &&
    typeof value.onRouteChange === 'function' &&
    typeof value.onSettle === 'function'
