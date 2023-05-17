import {
  schema,
  isStringOrRegExpArray,
  type ConfigOption,
  type Configuration,
  type CoreSchema
} from '@bugsnag/js-performance-core'
import { DefaultRoutingProvider, isRoutingProvider, type RoutingProvider } from './routing-provider'

export interface BrowserSchema extends CoreSchema {
  autoInstrumentFullPageLoads: ConfigOption<boolean>
  autoInstrumentNetworkRequests: ConfigOption<boolean>
  routingProvider: ConfigOption<RoutingProvider>
  urlsToExcludeWhenAwaitingSettle: ConfigOption<Array<string | RegExp>>
  networkInstrumentationIgnoreUrls: ConfigOption<Array<string | RegExp>>
}

export interface BrowserConfiguration extends Configuration {
  autoInstrumentFullPageLoads?: boolean
  autoInstrumentNetworkRequests?: boolean
  routingProvider?: RoutingProvider
  urlsToExcludeWhenAwaitingSettle?: Array<string | RegExp>
  networkInstrumentationIgnoreUrls?: Array<string | RegExp>
}

export function createSchema (hostname: string): BrowserSchema {
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
    routingProvider: {
      defaultValue: new DefaultRoutingProvider(),
      message: 'should be a routing provider',
      validate: isRoutingProvider
    },
    urlsToExcludeWhenAwaitingSettle: {
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
