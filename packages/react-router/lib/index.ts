import { onSettle } from '@bugsnag/browser-performance'
import { createReactRouterRoutingProvider } from './react-router-routing-provider'

export const ReactRouterRoutingProvider = createReactRouterRoutingProvider(onSettle, window.location)
