import {
  isBoolean,
  isStringOrRegExpArray,
  schema,
  type ConfigOption,
  type CoreSchema
} from '@bugsnag/core-performance'
import { defaultNetworkRequestCallback, isNetworkRequestCallback, type NetworkRequestCallback, type NetworkInstrumentationConfiguration } from '@bugsnag/request-tracker-performance'
import { isRoutingProvider, type RoutingProvider } from './routing-provider'
import { defaultSendPageAttributes, isSendPageAttributes, type SendPageAttributes } from './send-page-attributes'

export interface BrowserSchema extends CoreSchema {
  autoInstrumentFullPageLoads: ConfigOption<boolean>
  autoInstrumentNetworkRequests: ConfigOption<boolean>
  autoInstrumentRouteChanges: ConfigOption<boolean>
  generateAnonymousId: ConfigOption<boolean>
  routingProvider: ConfigOption<RoutingProvider>
  settleIgnoreUrls: ConfigOption<Array<string | RegExp>>
  networkRequestCallback: ConfigOption<NetworkRequestCallback>
  sendPageAttributes: ConfigOption<SendPageAttributes>
}

export interface BrowserConfiguration extends NetworkInstrumentationConfiguration {
  autoInstrumentFullPageLoads?: boolean
  autoInstrumentRouteChanges?: boolean
  generateAnonymousId?: boolean
  routingProvider?: RoutingProvider
  settleIgnoreUrls?: Array<string | RegExp>
  sendPageAttributes?: SendPageAttributes
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
    }
  }
}
