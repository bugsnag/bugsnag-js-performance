import {
  isStringOrRegExpArray,
  schema,
  type ConfigOption,
  type Configuration,
  type CoreSchema
} from '@bugsnag/core-performance'
import { isRoutingProvider, type RoutingProvider } from './routing-provider'

export interface BrowserSchema extends CoreSchema {
  autoInstrumentFullPageLoads: ConfigOption<boolean>
  autoInstrumentNetworkRequests: ConfigOption<boolean>
  autoInstrumentRouteChanges: ConfigOption<boolean>
  routingProvider: ConfigOption<RoutingProvider>
  settleIgnoreUrls: ConfigOption<Array<string | RegExp>>
  networkInstrumentationIgnoreUrls: ConfigOption<Array<string | RegExp>>
}

export interface BrowserConfiguration extends Configuration {
  autoInstrumentFullPageLoads?: boolean
  autoInstrumentNetworkRequests?: boolean
  autoInstrumentRouteChanges?: boolean
  routingProvider?: RoutingProvider
  settleIgnoreUrls?: Array<string | RegExp>
  networkInstrumentationIgnoreUrls?: Array<string | RegExp>
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
      validate: (value): value is boolean => value === true || value === false
    },
    autoInstrumentNetworkRequests: {
      defaultValue: true,
      message: 'should be true|false',
      validate: (value): value is boolean => value === true || value === false
    },
    autoInstrumentRouteChanges: {
      defaultValue: true,
      message: 'should be true|false',
      validate: (value): value is boolean => value === true || value === false
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
    networkInstrumentationIgnoreUrls: {
      defaultValue: [],
      message: 'should be an array of string|RegExp',
      validate: isStringOrRegExpArray
    }
  }
}
