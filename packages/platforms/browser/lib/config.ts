import {
  isBoolean,
  isStringWithLength,
  isStringOrRegExpArray,
  schema
} from '@bugsnag/core-performance'
import type { ConfigOption, Configuration, CoreSchema } from '@bugsnag/core-performance'
import { defaultNetworkRequestCallback, isNetworkRequestCallback } from '@bugsnag/request-tracker-performance'
import type { NetworkRequestCallback } from '@bugsnag/request-tracker-performance'
import type { BrowserNetworkRequestInfo } from './auto-instrumentation'
import { isRoutingProvider } from './routing-provider'
import type { RoutingProvider } from './routing-provider'
import { defaultSendPageAttributes, isSendPageAttributes } from './send-page-attributes'
import type { SendPageAttributes } from './send-page-attributes'

export interface BrowserSchema extends CoreSchema {
  autoInstrumentFullPageLoads: ConfigOption<boolean>
  autoInstrumentNetworkRequests: ConfigOption<boolean>
  autoInstrumentRouteChanges: ConfigOption<boolean>
  generateAnonymousId: ConfigOption<boolean>
  routingProvider: ConfigOption<RoutingProvider>
  settleIgnoreUrls: ConfigOption<Array<string | RegExp>>
  networkRequestCallback: ConfigOption<NetworkRequestCallback<BrowserNetworkRequestInfo>>
  sendPageAttributes: ConfigOption<SendPageAttributes>
  serviceName: ConfigOption<string>
}

export interface BrowserConfiguration extends Configuration {
  autoInstrumentFullPageLoads?: boolean
  autoInstrumentNetworkRequests?: boolean
  autoInstrumentRouteChanges?: boolean
  generateAnonymousId?: boolean
  routingProvider?: RoutingProvider
  settleIgnoreUrls?: Array<string | RegExp>
  networkRequestCallback?: NetworkRequestCallback<BrowserNetworkRequestInfo>
  sendPageAttributes?: SendPageAttributes
  serviceName?: string
}

export function createSchema (hostname: string, defaultRoutingProvider: RoutingProvider): BrowserSchema {
  return {
    ...schema,
    releaseStage: {
      ...schema.releaseStage,
      defaultValue: hostname === 'localhost' ? 'development' : 'production'
    },
    autoInstrumentFullPageLoads: {
      defaultValue: true,
      message: 'should be true|false',
      validate: isBoolean
    },
    autoInstrumentNetworkRequests: {
      defaultValue: true,
      message: 'should be true|false',
      validate: isBoolean
    },
    autoInstrumentRouteChanges: {
      defaultValue: true,
      message: 'should be true|false',
      validate: isBoolean
    },
    generateAnonymousId: {
      defaultValue: true,
      message: 'should be true|false',
      validate: isBoolean
    },
    routingProvider: {
      defaultValue: defaultRoutingProvider,
      message: 'should be a routing provider',
      validate: isRoutingProvider
    },
    settleIgnoreUrls: {
      defaultValue: [],
      message: 'should be an array of string|RegExp',
      validate: isStringOrRegExpArray
    },
    networkRequestCallback: {
      defaultValue: defaultNetworkRequestCallback,
      message: 'should be a function',
      validate: isNetworkRequestCallback
    },
    sendPageAttributes: {
      defaultValue: defaultSendPageAttributes,
      message: 'should be an object',
      validate: isSendPageAttributes
    },
    serviceName: {
      defaultValue: 'unknown_service',
      message: 'should be a string',
      validate: isStringWithLength
    }
  }
}
